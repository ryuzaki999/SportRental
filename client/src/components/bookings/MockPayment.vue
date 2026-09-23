<template>
  <div class="mock-page">
    <div class="mock-card">
      <h1 class="mock-title">หน้าจำลองการชำระเงิน</h1>
      <p class="mock-subtitle">นี่คือหน้าจำลองของผู้ให้บริการชำระเงิน (เช่น Stripe, Omise)</p>

      <h2 class="mock-order">คำสั่งซื้อ #{{ bookingId }}</h2>
      <p class="mock-method">
        ช่องทางการชำระเงิน: <strong>{{ paymentMethod }}</strong>
      </p>

      <div v-if="paymentMethod === 'promptpay'" class="mock-section">
        <p>กรุณาสแกน QR Code ด้านล่างเพื่อชำระเงิน</p>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com/promptpay-mock"
          alt="Mock QR Code"
          class="mock-qr"
        />
      </div>

      <div v-else-if="paymentMethod === 'credit-card'" class="mock-section">
        <label class="mock-label">ชื่อบนบัตร</label>
        <input type="text" value="John Doe" class="mock-input" disabled />
        <label class="mock-label">หมายเลขบัตร</label>
        <input type="text" value="**** **** **** 1234" class="mock-input" disabled />
        <label class="mock-label">วันหมดอายุ / CVC</label>
        <div class="mock-row">
          <input type="text" value="12/25" class="mock-input" disabled />
          <input type="text" value="***" class="mock-input" disabled />
        </div>
      </div>

      <p class="mock-note">ข้อมูลถูกกรอกไว้เพื่อการสาธิตเท่านั้น</p>

      <button class="mock-confirm" :disabled="submitting" @click="confirmPayment">
        {{ submitting ? 'กำลังยืนยัน...' : 'คลิกเพื่อยืนยันการชำระเงิน (จำลอง)' }}
      </button>
    </div>
  </div>
</template>

<script>
import BookingService from '@/services/BookingService';

export default {
  name: 'MockPayment',
  data() {
    return {
      bookingId: null,
      paymentMethod: null,
      submitting: false
    };
  },
  created() {
    // รองรับทั้ง ?bookingId= (ที่ใช้อยู่) และ ?booking= (รูปแบบเดิมของ PaymentController)
    this.bookingId = this.$route.query.bookingId || this.$route.query.booking || 'N/A';
    this.paymentMethod = this.$route.query.method || 'promptpay';
  },
  methods: {
    async confirmPayment() {
      if (this.submitting) return;
      this.submitting = true;
      try {
        // เดิมหน้านี้ไม่เรียก API ทำให้สถานะการจองไม่ถูกอัปเดตว่าชำระเงินแล้ว
        if (this.bookingId && this.bookingId !== 'N/A') {
          await BookingService.confirmPayment(this.bookingId);
        }
      } catch (e) {
        console.error('Confirm payment failed', e);
        alert('ไม่สามารถยืนยันการชำระเงินได้: ' +
          ((e.response && e.response.data && e.response.data.error) || e.message));
        this.submitting = false;
        return;
      }
      this.submitting = false;
      this.$router.push({
        name: 'booking-confirmation',
        query: { bookingId: this.bookingId }
      });
    }
  }
};
</script>

<style scoped>
.mock-page {
  padding: 2rem 1rem 3rem;
}

.mock-card {
  max-width: 460px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
  text-align: center;
}

.mock-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
}

.mock-subtitle {
  margin-top: 0.3rem;
  font-size: 0.85rem;
  color: #6b7280;
}

.mock-order {
  margin-top: 1.2rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111827;
}

.mock-method {
  margin-top: 0.2rem;
  font-size: 0.88rem;
  color: #374151;
}

.mock-section {
  margin-top: 1rem;
  text-align: left;
  font-size: 0.88rem;
  color: #374151;
}

.mock-qr {
  display: block;
  margin: 0.9rem auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
}

.mock-label {
  display: block;
  margin-top: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
}

.mock-input {
  width: 100%;
  margin-top: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.7rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
  background: #f9fafb;
  color: #374151;
}

.mock-row {
  display: flex;
  gap: 0.5rem;
}

.mock-note {
  margin-top: 1rem;
  font-size: 0.78rem;
  color: #9ca3af;
}

.mock-confirm {
  margin-top: 1rem;
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #ecfdf5;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.45);
}

.mock-confirm:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}
</style>
