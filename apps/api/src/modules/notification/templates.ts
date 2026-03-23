interface BookingReminderData {
  clientName: string;
  serviceName: string;
  professionalName: string;
  date: string; // formatted date
  startTime: string;
  address: string;
}

const baseStyle = `
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #FAF7F5;
  border-radius: 12px;
  overflow: hidden;
`;

const headerStyle = `
  background: linear-gradient(135deg, #C4918E, #D4A574);
  padding: 24px;
  text-align: center;
  color: white;
`;

const bodyStyle = `
  padding: 32px 24px;
  color: #3D2C29;
`;

const cardStyle = `
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  border: 1px solid #E8E0DC;
`;

const footerStyle = `
  padding: 16px 24px;
  text-align: center;
  color: #9E8E89;
  font-size: 12px;
`;

export function bookingReminderEmail(data: BookingReminderData): { subject: string; html: string } {
  return {
    subject: `Lembrete: ${data.serviceName} amanhã às ${data.startTime}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">✨ Bellu</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Lembrete de Agendamento</p>
        </div>
        <div style="${bodyStyle}">
          <p>Olá <strong>${data.clientName}</strong>,</p>
          <p>Este é um lembrete do seu agendamento para amanhã:</p>
          <div style="${cardStyle}">
            <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${data.serviceName}</p>
            <p style="margin: 0 0 8px;"><strong>Data:</strong> ${data.date}</p>
            <p style="margin: 0 0 8px;"><strong>Horário:</strong> ${data.startTime}</p>
            <p style="margin: 0 0 8px;"><strong>Profissional:</strong> ${data.professionalName}</p>
            <p style="margin: 0;"><strong>Local:</strong> ${data.address}</p>
          </div>
          <p style="font-size: 14px; color: #9E8E89;">Caso precise cancelar ou reagendar, entre em contato conosco.</p>
        </div>
        <div style="${footerStyle}">
          <p>Bellu - Beleza & Estética</p>
        </div>
      </div>
    `,
  };
}

export function bookingConfirmationEmail(data: BookingReminderData): { subject: string; html: string } {
  return {
    subject: `Agendamento confirmado: ${data.serviceName} - ${data.date}`,
    html: `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1 style="margin: 0; font-size: 24px;">✨ Bellu</h1>
          <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Confirmação de Agendamento</p>
        </div>
        <div style="${bodyStyle}">
          <p>Olá <strong>${data.clientName}</strong>,</p>
          <p>Seu agendamento foi confirmado com sucesso!</p>
          <div style="${cardStyle}">
            <p style="margin: 0 0 8px;"><strong>Serviço:</strong> ${data.serviceName}</p>
            <p style="margin: 0 0 8px;"><strong>Data:</strong> ${data.date}</p>
            <p style="margin: 0 0 8px;"><strong>Horário:</strong> ${data.startTime}</p>
            <p style="margin: 0 0 8px;"><strong>Profissional:</strong> ${data.professionalName}</p>
            <p style="margin: 0;"><strong>Local:</strong> ${data.address}</p>
          </div>
          <p style="font-size: 14px; color: #9E8E89;">Nos vemos em breve! 💅</p>
        </div>
        <div style="${footerStyle}">
          <p>Bellu - Beleza & Estética</p>
        </div>
      </div>
    `,
  };
}

export function bookingReminderSms(data: BookingReminderData): string {
  return `Bellu: Lembrete! ${data.serviceName} amanhã às ${data.startTime} com ${data.professionalName}. Local: ${data.address}`;
}

export function bookingConfirmationSms(data: BookingReminderData): string {
  return `Bellu: Agendamento confirmado! ${data.serviceName} dia ${data.date} às ${data.startTime} com ${data.professionalName}.`;
}
