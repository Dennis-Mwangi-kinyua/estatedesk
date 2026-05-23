export type MpesaStkPushInput = {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
};

export type MpesaStkPushResult = {
  merchantRequestId?: string;
  checkoutRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
};