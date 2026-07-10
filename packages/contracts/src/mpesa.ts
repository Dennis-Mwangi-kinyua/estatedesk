import { z } from "zod";

/** STK push request shape used by payments integrations. */
export const mpesaStkPushInputSchema = z.object({
  phone: z.string().min(9),
  amount: z.number().positive(),
  accountReference: z.string().min(1),
  transactionDesc: z.string().min(1),
});

export const mpesaStkPushResultSchema = z.object({
  merchantRequestId: z.string().optional(),
  checkoutRequestId: z.string().optional(),
  responseCode: z.string().optional(),
  responseDescription: z.string().optional(),
  customerMessage: z.string().optional(),
});

/** Daraja callback body (subset used for typing). */
export const mpesaCallbackBodySchema = z
  .object({
    Body: z
      .object({
        stkCallback: z
          .object({
            MerchantRequestID: z.string().optional(),
            CheckoutRequestID: z.string().optional(),
            ResultCode: z.union([z.number(), z.string()]).optional(),
            ResultDesc: z.string().optional(),
            CallbackMetadata: z
              .object({
                Item: z
                  .array(
                    z.object({
                      Name: z.string().optional(),
                      Value: z.union([z.string(), z.number()]).optional(),
                    }),
                  )
                  .optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

export type MpesaStkPushInput = z.infer<typeof mpesaStkPushInputSchema>;
export type MpesaStkPushResult = z.infer<typeof mpesaStkPushResultSchema>;
export type MpesaCallbackBody = z.infer<typeof mpesaCallbackBodySchema>;
