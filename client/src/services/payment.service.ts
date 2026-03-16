const BASE_URL = "http://localhost:5000/api/v1";

export interface PaymentResult {
    paymentId: number;
    obligationName: string;
    receiptUrl: string;
    amountPaid: number;
    paymentStatus: string;
    submittedAt: string;
}

export const paymentService = {
    submitReceipt: async (
        token: string,
        studentObligationId: number,
        amountPaid: number,
        receipt: File,
        notes?: string
    ): Promise<PaymentResult> => {
        const form = new FormData();
        form.append("receipt", receipt);
        form.append("studentObligationId", String(studentObligationId));
        form.append("amountPaid", String(amountPaid));
        if (notes) form.append("notes", notes);

        const res = await fetch(`${BASE_URL}/payments`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to submit payment");
        return json.data;
    },
};
