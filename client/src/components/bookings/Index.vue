<template>
  <div class="booking-history-page">
    <div class="booking-history-inner">
      <header class="page-header">
        <div>
          <p class="page-label">การจองของฉัน</p>
          <h1 class="page-title">ประวัติการจองของคุณ</h1>
          <p class="page-subtitle">
            ดูรายการจองย้อนหลัง จัดการสถานะ และตรวจสอบรายละเอียดแต่ละการจองได้จากที่นี่
          </p>
        </div>
      </header>

      <!-- Filters -->
      <div class="filters-panel">
        <div class="filters-grid">
          <div>
            <label for="field-search" class="filter-label">ค้นหาสนาม</label>
            <input
              type="text"
              id="field-search"
              v-model="filters.fieldId"
              placeholder="ID หรือชื่อสนาม"
              class="filter-input"
            />
          </div>
          <div>
            <label for="status-select" class="filter-label">สถานะ</label>
            <select
              id="status-select"
              v-model="filters.status"
              class="filter-input"
            >
              <option value="">ทั้งหมด</option>
              <option value="pending-payment">รอชำระเงิน</option>
              <option value="confirmed">ยืนยันแล้ว</option>
              <option value="checked-in">เช็คอินแล้ว</option>
              <option value="cancelled">ยกเลิกแล้ว</option>
            </select>
          </div>
          <div>
            <label for="start-date" class="filter-label">วันที่เริ่มต้น</label>
            <input
              type="date"
              id="start-date"
              v-model="filters.start"
              class="filter-input"
            />
          </div>
          <div>
            <label for="end-date" class="filter-label">วันที่สิ้นสุด</label>
            <input
              type="date"
              id="end-date"
              v-model="filters.end"
              class="filter-input"
            />
          </div>
        </div>
        <div class="filters-actions">
          <button @click="reset" class="btn-secondary">ล้างค่า</button>
          <button @click="search" class="btn-primary">ค้นหา</button>
        </div>
      </div>

      <!-- Booking List -->
      <div v-if="loading" class="state-box">
        <p>กำลังโหลดข้อมูลการจอง...</p>
      </div>
      <div v-else-if="bookings.length === 0" class="state-box state-empty">
        <p>ไม่พบประวัติการจองที่ตรงกับเงื่อนไข</p>
      </div>
      <div v-else class="booking-list">
        <article v-for="b in bookings" :key="b.id" class="booking-card">
          <div class="booking-thumb">
            <img
              :src="b.Field?.image || 'https://placehold.co/600x400?text=Field'"
              alt="Field Image"
            />
          </div>
          <div class="booking-content">
            <div class="booking-row">
              <div>
                <h2 class="booking-field-title">
                  {{ b.Field ? b.Field.name : `Field ID: ${b.fieldId}` }}
                </h2>
                <p class="booking-field-location">
                  {{ b.Field ? b.Field.location : '' }}
                </p>
              </div>
              <span class="status-badge" :class="`status-${b.status || 'pending'}`">
                {{ b.status || 'pending' }}
              </span>
            </div>
            <div class="booking-meta">
              <p>
                <span>ผู้จอง:</span>
                <strong>{{ b.User ? (b.User.name || b.User.email) : `User ID: ${b.userId}` }}</strong>
              </p>
              <p>
                <span>ช่วงเวลา:</span>
                <strong>{{ format(b.startTime) }} – {{ format(b.endTime) }}</strong>
              </p>
              <p>
                <span>ยอดรวม:</span>
                <strong>{{ b.totalPrice || '-' }} บาท</strong>
              </p>
            </div>
            <div class="card-actions">
              <router-link
                :to="{ name: 'booking-show', params: { bookingId: b.id } }"
                class="link-primary"
              >
                ดูรายละเอียด
              </router-link>
              <router-link
                v-if="b.status === 'pending-payment' || b.status === 'pending'"
                :to="{ name: 'checkout', query: { bookingId: b.id } }"
                class="link-pay"
              >
                ชำระเงิน
              </router-link>
              <button
                v-if="b.status !== 'cancelled' && b.status !== 'checked-in'"
                @click="cancel(b)"
                class="link-danger"
              >
                ยกเลิกการจอง
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Pagination/Load More -->
      <div v-if="!loading && bookings.length < total" class="load-more-row">
         <button @click="loadMore" class="btn-load-more">โหลดเพิ่มเติม</button>
      </div>
    </div>
  </div>
</template>

<script>
import BookingService from '@/services/BookingService';
import { mapState } from 'pinia';
import { useAuthenStore } from '@/stores/authen';

export default {
  data () {
    return { bookings: [], limit: 10, offset: 0, loading: false, total: 0, filters: { fieldId: '', status: '', start: '', end: '' } }
  },
  computed: {
    ...mapState(useAuthenStore, {
      user: 'user',
      isLoggedIn: 'isUserLoggedIn'
    }),
  },
  async created () {
    if (!this.isLoggedIn) {
      this.$router.push({ name: 'login', query: { redirect: this.$route.fullPath } });
      return;
    }
    await this.search()
  },
  methods: {
    async load (reset = false) {
      if (this.loading) return
      if (reset) { this.offset = 0; this.bookings = []; this.total = 0 }
      this.loading = true
      try {
        const params = { limit: this.limit, offset: this.offset }
        const fieldFilter = (this.filters.fieldId || '').toString().trim()
        if (fieldFilter) {
          if (/^\d+$/.test(fieldFilter)) {
            params.fieldId = fieldFilter
          } else {
            params.search = fieldFilter
          }
        }
        if (this.filters.status) params.status = this.filters.status;
        
        if (this.filters.start) {
          params.start = new Date(this.filters.start).toISOString();
        }
        if (this.filters.end) {
          // Set to end of day
          let endDate = new Date(this.filters.end);
          endDate.setHours(23, 59, 59, 999);
          params.end = endDate.toISOString();
        }

        // if admin, show all, otherwise backend will scope to user
        if (this.user?.role === 'admin') {
            params.all = 1
        }
        
        const res = await BookingService.index(params)
        const rows = res.data.rows || []
        const count = res.data.count || 0
        this.bookings = this.bookings.concat(rows)
        this.offset += rows.length
        this.total = count
      } catch (err) { console.error(err) }
      finally { this.loading = false }
    },
    async search () {
      await this.load(true)
    },
    async reset () {
      this.filters = { fieldId: '', status: '', start: '', end: '' }
      await this.load(true)
    },
    async loadMore () { await this.load(false) },
    format (iso) {
      try { return new Date(iso).toLocaleString('th-TH') } catch (e) { return iso }
    },
    async cancel (b) {
      if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้?')) return;
      try {
        await BookingService.put({ id: b.id, status: 'cancelled' })
        // Refresh just that item instead of full reload
        const index = this.bookings.findIndex(booking => booking.id === b.id);
        if (index !== -1) {
            this.bookings[index].status = 'cancelled';
        }
      } catch (err) { 
          console.error(err);
          alert('ไม่สามารถยกเลิกการจองได้');
      }
    }
  }
}
</script>

<style scoped>
.booking-history-page {
  padding: 1.3rem 1rem 2.5rem;
}

.booking-history-inner {
  max-width: 1120px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1rem;
}

.page-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6366f1;
}

.page-title {
  margin-top: 0.2rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  margin-top: 0.3rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.filters-panel {
  margin-top: 0.6rem;
  margin-bottom: 1rem;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.filter-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.filter-input {
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  color: #111827;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-primary,
.btn-secondary {
  border-radius: 999px;
  padding: 0.45rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  border: none;
  background: #2563eb;
  color: #eff6ff;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.state-box {
  margin-top: 1rem;
  text-align: center;
  padding: 1.5rem;
  font-size: 0.9rem;
  color: #111827;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

.state-empty {
  color: #6b7280;
}

.booking-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.booking-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #ffffff;
  border-radius: 1.1rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  padding: 0.75rem;
}

.booking-thumb img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 0.9rem;
}

.booking-content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.booking-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
}

.booking-field-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.booking-field-location {
  font-size: 0.85rem;
  color: #6b7280;
}

.booking-meta {
  margin-top: 0.2rem;
  font-size: 0.85rem;
  color: #374151;
}

.booking-meta p {
  margin: 0.1rem 0;
}

.booking-meta span {
  display: inline-block;
  min-width: 72px;
  color: #6b7280;
}

.card-actions {
  margin-top: 0.4rem;
  display: flex;
  gap: 0.75rem;
  font-size: 0.85rem;
}

.link-primary {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.link-primary:hover {
  text-decoration: underline;
}

.link-pay {
  color: #b45309;
  font-weight: 700;
  text-decoration: none;
}

.link-pay:hover {
  text-decoration: underline;
}

.link-danger {
  border: none;
  background: transparent;
  color: #dc2626;
  font-weight: 500;
  cursor: pointer;
}

.link-danger:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 0.25em 0.6em;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 0.375rem;
}
.status-pending-payment { background-color: #fef3c7; color: #92400e; }
.status-pending { background-color: #fef3c7; color: #92400e; }
.status-confirmed { background-color: #d1fae5; color: #065f46; }
.status-checked-in { background-color: #cce7f1; color: #0f5d7f; }
.status-cancelled { background-color: #fee2e2; color: #991b1b; }

.load-more-row {
  margin-top: 1.5rem;
  text-align: center;
}

.btn-load-more {
  border-radius: 999px;
  padding: 0.55rem 1.6rem;
  border: none;
  background: #111827;
  color: #f9fafb;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-load-more:hover {
  background: #020617;
}

@media (min-width: 768px) {
  .booking-card {
    flex-direction: row;
    padding: 0.9rem;
  }

  .booking-thumb {
    width: 26%;
  }

  .booking-thumb img {
    height: 100%;
  }

  .booking-content {
    flex: 1;
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .filters-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
