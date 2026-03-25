import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import {
  conversationsApi,
  uploadApi,
  type ConversationMessageData,
} from '../../services/api';
import { wsManager } from '../../services/websocket';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ConversationMessageData[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [headerName, setHeaderName] = useState('Chat');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const res = await conversationsApi.getMessages(conversationId);
      const data = res.data;
      setMessages(data.messages || []);

      // Set header name from conversation info
      const conv = data.conversation;
      if (conv) {
        const isClient = conv.client.id === user?.id;
        setHeaderName(isClient ? conv.professional.businessName : conv.client.name);
      }

      // Mark as read
      conversationsApi.markRead(conversationId).catch(() => {});
    } catch {
      // keep existing messages
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Listen for real-time messages via WebSocket
    const unsubWs = wsManager.on('new_message', (data) => {
      if (data?.conversationId === conversationId && data?.message) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        // Mark as read since user is viewing this conversation
        conversationsApi.markRead(conversationId!).catch(() => {});
      }
    });

    // Listen for read receipts
    const unsubRead = wsManager.on('messages_read', (data) => {
      if (data?.conversationId === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id && !m.readAt
              ? { ...m, readAt: new Date().toISOString() }
              : m,
          ),
        );
      }
    });

    // Fallback: poll every 30s in case WebSocket disconnects
    pollingRef.current = setInterval(loadMessages, 30000);

    return () => {
      unsubWs();
      unsubRead();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !conversationId) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await conversationsApi.sendMessage(conversationId, { message: text });
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel enviar a mensagem');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    if (!conversationId) return;
    setUploading(true);
    try {
      const uploadRes = await uploadApi.uploadImage(uri, 'chat');
      const imageUrl = uploadRes.data.url;

      const res = await conversationsApi.sendMessage(conversationId, { imageUrl });
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      console.error('[Chat] Photo upload error:', err);
      const msg = err?.message?.includes('inappropriate_content')
        ? t('common.inappropriateImage')
        : (err?.message || t('common.uploadFailed'));
      Alert.alert(t('common.error'), msg);
    } finally {
      setUploading(false);
    }
  };

  const handleImageOptions = () => {
    if (!conversationId) return;
    Alert.alert('Enviar foto', 'Escolha uma opcao', [
      {
        text: 'Tirar foto',
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permissao necessaria', 'Precisamos de acesso a camera.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            uploadAndSendImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Escolher da galeria',
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert('Permissao necessaria', 'Precisamos de acesso a galeria.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            uploadAndSendImage(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const isMyMessage = (msg: ConversationMessageData) => msg.senderId === user?.id;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{headerName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptySubtext}>Envie uma mensagem para iniciar a conversa</Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = isMyMessage(item);
            return (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[styles.messageBubble, mine ? styles.myMessage : styles.theirMessage]}
              >
                {item.imageUrl && (
                  <Pressable onPress={() => setViewingImage(item.imageUrl)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.messageImage}
                      contentFit="cover"
                      transition={200}
                    />
                  </Pressable>
                )}
                {item.message && (
                  <Text style={[styles.messageText, mine && styles.myMessageText]}>
                    {item.message}
                  </Text>
                )}
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, mine && styles.myMessageTime]}>
                    {new Date(item.createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {mine && (
                    <Ionicons
                      name={item.readAt ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={item.readAt ? '#7D9B76' : 'rgba(255,255,255,0.6)'}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </Animated.View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <Pressable onPress={handleImageOptions} style={styles.attachButton} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="image-outline" size={24} color={colors.primary} />
            )}
          </Pressable>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.white : colors.textTertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Viewer */}
      <Modal visible={!!viewingImage} transparent animationType="fade" onRequestClose={() => setViewingImage(null)}>
        <Pressable style={styles.imageModal} onPress={() => setViewingImage(null)}>
          <Pressable style={styles.imageModalClose} onPress={() => setViewingImage(null)}>
            <Ionicons name="close" size={28} color={colors.white} />
          </Pressable>
          {viewingImage && (
            <Image
              source={{ uri: viewingImage }}
              style={styles.imageModalFull}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: { padding: spacing.sm },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  chatContainer: { flex: 1 },
  messageList: {
    padding: spacing.lg,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  myMessage: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
  myMessageText: {
    color: colors.white,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: spacing.sm,
  },
  imageModalFull: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
});
