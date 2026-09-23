<template>
  <div class="promptpay-modal">
    <h2 class="promptpay-title">สแกนเพื่อชำระเงิน (PromptPay)</h2>

    <div v-if="qrPayload" class="qr-container">
      <vue-qrcode :value="qrPayload" :options="{ width: 220 }"></vue-qrcode>
    </div>
    <p v-else class="qr-empty">ไม่มียอดเงินให้ชำระ</p>

    <p class="amount-line">
      ยอดชำระ <strong>{{ amount.toFixed(2) }}</strong> บาท
    </p>
    <p class="hint">เปิดแอปธนาคารแล้วสแกน QR นี้เพื่อชำระเงิน (เป็นการจำลอง)</p>

    <button class="pay-confirm-btn" @click="confirm">ฉันชำระเงินแล้ว</button>
  </div>
</template>

<script>
import { generatePayload } from 'promptpay-qr';
import VueQrcode from 'vue-qrcode';

export default {
  name: 'PromptPay',
  components: { VueQrcode },
  props: {
    amount: {
      type: Number,
      required: true,
    },
    bookingId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      // หมายเลข PromptPay ที่ใช้รับเงิน (เบอร์โทร / เลขบัตรประชาชน) — แก้เป็นเลขจริงได้
      promptPayId: '0812345678',
      qrPayload: null
    };
  },
  created() {
    this.generateQR();
  },
  methods: {
    generateQR() {
      if (this.amount > 0) {
        this.qrPayload = generatePayload(this.promptPayId, { amount: this.amount });
      } else {
        this.qrPayload = null;
      }
    },
    confirm() {
      // ส่ง event ให้หน้าหลัก (Checkout) ไปยืนยันการชำระเงินกับ backend
      this.$emit('payment-confirmed', this.bookingId);
    }
  },
  watch: {
    amount() {
      this.generateQR();
    }
  }
};
</script>

<style scoped>
.promptpay-modal {
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 0.5rem 0.25rem 0.25rem;
  text-align: center;
}

.promptpay-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.9rem;
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
}

.qr-empty {
  font-size: 0.85rem;
  color: #b91c1c;
  padding: 1rem;
}

.amount-line {
  margin-top: 0.9rem;
  font-size: 0.95rem;
  color: #374151;
}

.amount-line strong {
  font-size: 1.2rem;
  font-weight: 800;
  color: #059669;
}

.hint {
  margin-top: 0.35rem;
  font-size: 0.78rem;
  color: #6b7280;
}

.pay-confirm-btn {
  margin-top: 1rem;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #ecfdf5;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.45);
  transition: transform 0.15s ease;
}

.pay-confirm-btn:hover {
  transform: translateY(-1px);
}
</style>
