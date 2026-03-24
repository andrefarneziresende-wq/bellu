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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radii } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import {
  conversationsApi,
  uploadImage,
  type ConversationMessageData,
} from '../../services/api';

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const proContext = useAuthStore((s) => s.proContext);
  const professional = useAuthStore((s) => s.professional);
  const [messages, setMessages] = useState<ConversationMessageData[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [headerName, setHeaderName] = useState('Chat');
  const flatListRef = useRef<FlatList>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // The logged-in user's userId (from proContext or professional)
  const myUserId = professional?.id; // This may not match — we'll use senderId comparison from conversation

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const res = await conversationsApi.getMessages(conversationId);
      const data = res.data;
      setMessages(data.messages || []);

      // For professionals, the other party is the client
      const conv = data.conversation;
      if (conv) {
        setHeaderName(conv.client.name);
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
    pollingRef.current = setInterval(loadMessages, 5000);
    return () => {
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
      Alert.alert(t('common.error'), t('conversations.sendError', 'Nao foi possivel enviar a mensagem'));
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const uploadAndSendImage = async (uri: string) => {
    if (!conversationId) return;
    setUploading(true);
    try {
      const uploadRes = await uploadImage(uri, 'chat');
      const imageUrl = uploadRes.data.url;

      const res = await conversationsApi.sendMessage(conversationId, { imageUrl });
      setMessages((prev) => [...prev, res.data]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert(t('common.error'), t('conversations.photoError', 'Nao foi possivel enviar a foto'));
    } finally {
      setUploading(false);
    }
  };

  const handleImageOptions = () => {
    if (!conversationId) return;
    Alert.alert(t('conversations.sendPhoto', 'Enviar foto'), t('conversations.chooseOption', 'Escolha uma opcao'), [
      {
        text: t('conversations.takePhoto', 'Tirar foto'),
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(t('conversations.permissionNeeded', 'Permissao necessaria'), t('conversations.cameraAccess', 'Precisamos de acesso a camera.'));
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
        text: t('conversations.fromGallery', 'Escolher da galeria'),
        onPress: async () => {
          const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(t('conversations.permissionNeeded', 'Permissao necessaria'), t('conversations.galleryAccess', 'Precisamos de acesso a galeria.'));
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
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  // Determine if message is mine — for professional, check if sender is NOT the client
  const isMyMessage = (msg: ConversationMessageData) => {
    // In conversation context, the professional's user sends messages
    // We compare sender name with professional business name as fallback
    // But ideally we match by the conversation's professional.userId
    return msg.senderId !== messages[0]?.conversationId; // fallback; real check below
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Detect which userId is the client from conversation data
  // Messages from anyone who is NOT the client = my messages (professional side)
  const clientSenderId = messages.length > 0
    ? messages.find((m) => m.sender.name !== headerName)?.senderId || null
    : null;

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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>{t('conversations.noMessages', 'Nenhuma mensagem ainda')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            // Professional sees client messages on left, own messages on right
            // Client name = headerName, so messages from someone with that name are theirs
            const mine = item.sender.name !== headerName;
            return (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[styles.messageBubble, mine ? styles.myMessage : styles.theirMessage]}
              >
                {item.imageUrl && (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.messageImage}
                    contentFit="cover"
                    transition={200}
                  />
                )}
                {item.message && (
                  <Text style={[styles.messageText, mine && styles.myMessageText]}>
                    {item.message}
                  </Text>
                )}
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, mine && styles.myMessageTime]}>
                    {new Date(item.createdAt).toLocaleTimeString(undefined, {
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
            placeholder={t('conversations.typePlaceholder', 'Digite sua mensagem...')}
            placeholderTextColor={colors.textSecondary}
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
              color={inputText.trim() ? colors.white : colors.textSecondary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 15,
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
    color: colors.textSecondary,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
});
