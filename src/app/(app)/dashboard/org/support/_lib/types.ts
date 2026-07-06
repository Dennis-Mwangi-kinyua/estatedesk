export type SupportMessage = {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
};

export type SupportPageData = {
  organizationName: string;
  messages: SupportMessage[];
  stats: {
    totalMessages: number;
    openMessages: number;
    readMessages: number;
  };
};