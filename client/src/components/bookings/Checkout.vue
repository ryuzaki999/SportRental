<template>
  <div class="checkout-page">
    <div class="checkout-card">
      <header class="checkout-header">
        <p class="checkout-label">ขั้นตอนชำระเงิน</p>
        <h1 class="checkout-title">สรุปรายการจองและชำระเงิน</h1>
      </header>

      <div v-if="loading" class="state-box">กำลังโหลดข้อมูลการจอง...</div>

      <div v-else-if="!booking" class="state-box">
        <p>ไม่พบข้อมูลการจองสำหรับชำระเงิน</p>
        <p class="state-hint">กรุณาเลือกสนามและทำการจองก่อน ระบบจะพากลับมาที่หน้านี้</p>
        <button class="btn-secondary" @click="$router.push({ name: 'fields' })">
          กลับไปหน้าค้นหาสนาม
        </button>
      </div>

      <div v-else>
        <section class="summary">
          <div class="summary-head">
            <h2>{{ booking.Field ? booking.Field.name : ('การจอง #' + booking.id) }}</h2>
            <span class="status-pill" :class="'status-' + (booking.status || 'pending-payment')">
              {{ statusLabel(booking.status) }}
            </span>
          </div>

          <ul class="summary-list">
            <li><span>หมายเลขการจอง</span><strong>#{{ booking.id }}</strong></li>
            <li v-if="booking.Field && booking.Field.location">
              <span>สถานที่</span><strong>{{ booking.Field.location }}</strong>
            </li>
            <li><span>เริ่ม</span><strong>{{ format(booking.startTime) }}</strong></li>
            <li><span>สิ้นสุด</span><strong>{{ format(booking.endTime) }}</strong></li>
          </ul>

          <div v-if="booking.equipmentItems && booking.equipmentItems.length" class="equipment-block">
            <h3>อุปกรณ์เสริม</h3>
            <ul>
              <li v-for="(it, i) in booking.equipmentItems" :key="i">
                <span>{{ equipmentMap[it.equipmentId] || ('อุปกรณ์ #' + it.equipmentId) }}</span>
                <span class="qty">&times; {{ it.qty }}</span>
              </li>
            </ul>
          </div>

          <div class="total-row">
            <span>ยอดรวม</span>
            <strong>{{ formatAmount(booking.totalPrice) }} บาท</strong>
          </div>
        </section>

        <section v-if="isPaid" class="paid-box">
          <p>การจองนี้ชำระเงินเรียบร้อยแล้ว</p>
          <button class="btn-secondary" @click="goToBooking">ดูรายละเอียดการจอง</button>
        </section>

        <section v-else class="payment-section">
          <h3>เลือกช่องทางการชำระเงิน</h3>
          <div class="payment-actions">
            <button class="btn-promptpay" :disabled="processing" @click="initiatePayment('promptpay')">
              ชำระด้วย QR Code (PromptPay)
            </button>
            <button class="btn-card" :disabled="processing" @click="initiatePayment('credit-card')">
              ชำระด้วยบัตรเครดิต
            </button>
          </div>
          <p class="payment-hint">* เป็นการชำระเงินจำลองเพื่อการสาธิต ไม่มีการตัดเงินจริง</p>
        </section>

        <div class="actions-row">
          <button class="btn-back" @click="goToBooking">&larr; ดูรายละเอียดการจอง</button>
        </div>
      </div>
    </div>

    <div v-if="showPromptPayModal" class="modal-overlay" @click.self="showPromptPayModal = false">
      <div class="modal-box">
        <prompt-pay
          :amount="amount"
          :booking-id="booking.id"
          @payment-confirmed="handlePaymentConfirmed"
        />
        <button class="modal-close" @click="showPromptPayModal = false">ปิด</button>
      </div>
    </div>
  </div>
</template>

<script>
import BookingService from '@/services/BookingService';
import EquipmentService from '@/services/EquipmentService';
import PromptPay from './PromptPay.vue';

export default {
  name: 'Checkout',
  components: { PromptPay },
  data() {
    return {
      booking: null,
      equipmentMap: {},
      loading: true,
      processing: false,
      showPromptPayModal: false
    };
  },
  computed: {
    amount() {
      return Number(this.booking && this.booking.totalPrice) || 0;
    },
    isPaid() {
      const b = this.booking;
      if (!b) return false;
      return b.paid === true || b.status === 'confirmed' || b.status === 'checked-in';
    }
  },
  async created() {
    await this.loadBooking();
  },
  methods: {
    async loadBooking() {
      const bookingId = this.$route.query.bookingId;
      if (!bookingId) {
        this.loading = false;
        return;
      }
      try {
        const res = await BookingService.show(bookingId);
        this.booking = res.data || null;
        if (this.booking && Array.isArray(this.booking.equipmentItems) && this.booking.equipmentItems.length) {
          try {
            const eq = await EquipmentService.index();
            const map = {};
            (eq.data || []).forEach((e) => { map[e.id] = e.name; });
            this.equipmentMap = map;
          } catch (e) {
            console.error('Failed to load equipment list', e);
          }
        }
      } catch (e) {
        console.error('Load booking failed', e);
        this.booking = null;
      } finally {
        this.loading = false;
      }
    },
    format(iso) {
      try { return new Date(iso).toLocaleString('th-TH'); } catch (e) { return iso; }
    },
    formatAmount(value) {
      return Number(value || 0).toLocaleString();
    },
    statusLabel(status) {
      const map = {
        'pending-payment': 'รอชำระเงิน',
        'pending': 'รอชำระเงิน',
        'confirmed': 'ยืนยันแล้ว',
        'checked-in': 'เช็คอินแล้ว',
        'cancelled': 'ยกเลิกแล้ว'
      };
      return map[status] || status || 'รอชำระเงิน';
    },
    initiatePayment(method) {
      if (!this.booking) return;
      if (method === 'promptpay') {
        this.showPromptPayModal = true;
      } else {
        this.$router.push({ name: 'mock-payment', query: { bookingId: this.booking.id, method } });
      }
    },
    async handlePaymentConfirmed(bookingId) {
      try {
        await BookingService.confirmPayment(bookingId);
        this.showPromptPayModal = false;
        this.$router.push({ name: 'booking-confirmation', query: { bookingId } });
      } catch (error) {
        console.error('Payment confirmation failed:', error);
        alert('ไม่สามารถยืนยันการชำระเงินได้: ' +
          ((error.response && error.response.data && error.response.data.error) || error.message));
      }
    },
    goToBooking() {
      this.$router.push({ name: 'booking-show', params: { bookingId: this.booking.id } });
    }
  }
};
</script>

<style scoped>
.checkout-page {
  padding: 1.5rem 1rem 3rem;
}

.checkout-card {
  max-width: 720px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
}

.checkout-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6366f1;
}

.checkout-title {
  margin-top: 0.2rem;
  margin-bottom: 1.2rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

.state-box {
  border-radius: 1rem;
  background: #f9fafb;
  padding: 1.25rem;
  text-align: center;
  color: #374151;
  font-size: 0.9rem;
}

.state-hint {
  margin: 0.4rem 0 0.9rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.summary {
  border-radius: 1rem;
  background: #f9fafb;
  padding: 1rem 1.1rem;
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.summary-head h2 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.status-pill {
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-pending-payment,
.status-pending { background-color: #fef3c7; color: #92400e; }
.status-confirmed { background-color: #d1fae5; color: #065f46; }
.status-checked-in { background-color: #e0f2fe; color: #075985; }
.status-cancelled { background-color: #fee2e2; color: #991b1b; }

.summary-list {
  list-style: none;
  padding: 0;
  margin: 0.8rem 0 0;
  font-size: 0.88rem;
}

.summary-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.22rem 0;
  color: #4b5563;
}

.summary-list li strong { color: #111827; }

.equipment-block { margin-top: 0.9rem; }

.equipment-block h3 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.3rem;
}

.equipment-block ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.86rem;
}

.equipment-block li {
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  color: #374151;
}

.equipment-block .qty { color: #6b7280; }

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.95rem;
  color: #374151;
}

.total-row strong {
  font-size: 1.35rem;
  font-weight: 800;
  color: #059669;
}

.paid-box {
  margin-top: 1rem;
  border-radius: 1rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 1rem;
  text-align: center;
  color: #065f46;
  font-weight: 600;
}

.payment-section { margin-top: 1.2rem; }

.payment-section h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.6rem;
}

.payment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.btn-promptpay,
.btn-card,
.btn-secondary,
.btn-back {
  border-radius: 999px;
  padding: 0.6rem 1.2rem;
  font-size: 0.87rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s ease, transform 0.15s ease;
}

.btn-promptpay {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ecfdf5;
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.45);
}

.btn-promptpay:hover:not(:disabled) { transform: translateY(-1px); }

.btn-card {
  background: #1d4ed8;
  color: #eff6ff;
  box-shadow: 0 12px 28px rgba(29, 78, 216, 0.35);
}

.btn-card:hover:not(:disabled) { transform: translateY(-1px); }

.btn-promptpay:disabled,
.btn-card:disabled { opacity: 0.65; cursor: not-allowed; box-shadow: none; }

.btn-secondary {
  margin-top: 0.6rem;
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}

.btn-secondary:hover { background: #e5e7eb; }

.payment-hint {
  margin-top: 0.6rem;
  font-size: 0.78rem;
  color: #6b7280;
}

.actions-row { margin-top: 1.2rem; }

.btn-back {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #374151;
  font-size: 0.85rem;
}

.btn-back:hover { background: #e5e7eb; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal-box {
  background: #ffffff;
  border-radius: 1.25rem;
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.35);
  padding: 1rem;
  width: 100%;
  max-width: 420px;
}

.modal-close {
  margin-top: 0.75rem;
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
  border-radius: 999px;
  padding: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.modal-close:hover { background: #e5e7eb; }
</style>
