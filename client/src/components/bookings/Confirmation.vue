<template>
  <div class="confirm-page">
    <div class="confirm-card">
      <div class="confirm-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h1 class="confirm-title">การจองสำเร็จ!</h1>
      <p class="confirm-subtitle">ขอบคุณที่ใช้บริการของเรา</p>

      <div class="confirm-box">
        <h2>รายละเอียดการจอง</h2>
        <ul>
          <li><span>หมายเลขการจอง</span><strong>#{{ bookingId }}</strong></li>
          <li v-if="booking.Field"><span>สนาม</span><strong>{{ booking.Field.name }}</strong></li>
          <li v-if="booking.Field && booking.Field.location">
            <span>สถานที่</span><strong>{{ booking.Field.location }}</strong>
          </li>
          <li v-if="booking.startTime"><span>เริ่ม</span><strong>{{ format(booking.startTime) }}</strong></li>
          <li v-if="booking.endTime"><span>สิ้นสุด</span><strong>{{ format(booking.endTime) }}</strong></li>
          <li v-if="booking.totalPrice">
            <span>ยอดชำระ</span><strong>{{ Number(booking.totalPrice).toLocaleString() }} บาท</strong>
          </li>
        </ul>
        <p class="confirm-note">เราได้ส่งอีเมลยืนยันพร้อมรายละเอียดการจองของคุณแล้ว (จำลอง)</p>
      </div>

      <div class="confirm-actions">
        <router-link to="/bookings" class="link-primary">ดูประวัติการจองทั้งหมด</router-link>
        <span class="sep">|</span>
        <router-link to="/fields" class="link-primary">กลับไปหน้าสนาม</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import BookingService from '@/services/BookingService';

export default {
  name: 'BookingConfirmation',
  data() {
    return {
      bookingId: null,
      booking: {}
    };
  },
  async created() {
    this.bookingId = this.$route.query.bookingId || 'N/A';
    if (this.bookingId && this.bookingId !== 'N/A') {
      try {
        const res = await BookingService.show(this.bookingId);
        this.booking = res.data || {};
      } catch (e) {
        console.error('Load booking failed', e);
      }
    }
  },
  methods: {
    format(iso) {
      try { return new Date(iso).toLocaleString('th-TH'); } catch (e) { return iso; }
    }
  }
};
</script>

<style scoped>
.confirm-page {
  padding: 2.5rem 1rem 3rem;
}

.confirm-card {
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 2rem;
  text-align: center;
}

.confirm-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 0.75rem;
  color: #22c55e;
}

.confirm-icon svg {
  width: 100%;
  height: 100%;
}

.confirm-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.confirm-subtitle {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.confirm-box {
  margin-top: 1.4rem;
  text-align: left;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1rem 1.1rem;
}

.confirm-box h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.confirm-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.88rem;
}

.confirm-box li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.22rem 0;
  color: #4b5563;
}

.confirm-box li strong {
  color: #111827;
  text-align: right;
}

.confirm-note {
  margin-top: 0.7rem;
  font-size: 0.78rem;
  color: #9ca3af;
}

.confirm-actions {
  margin-top: 1.4rem;
  font-size: 0.88rem;
}

.link-primary {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.link-primary:hover {
  text-decoration: underline;
}

.sep {
  margin: 0 0.6rem;
  color: #d1d5db;
}
</style>
