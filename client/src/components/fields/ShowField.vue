<template>
  <div class="field-page">
    <div class="field-layout">
      <section class="field-main">
        <header class="field-header">
          <div>
            <p class="field-sport">
              {{ field.sportType || 'สนามกีฬา' }}
            </p>
            <h1 class="field-title">
              {{ field.name || 'รายละเอียดสนาม' }}
            </h1>
            <p v-if="field.location" class="field-location">
              {{ field.location }}
            </p>
          </div>
          <div class="field-meta">
            <div class="field-price">
              <span class="price-label">ราคาเริ่มต้น</span>
              <span class="price-value">{{ field.price || '-' }} บาท / ชั่วโมง</span>
            </div>
            <button class="primary-btn" @click="bookNow">
              จองสนามนี้
            </button>
          </div>
        </header>

        <div class="field-media">
          <div class="field-image-main">
            <img
              v-if="mainImage"
              :src="mainImage"
              alt="main"
            />
            <div v-else class="field-image-placeholder">
              ไม่มีรูปภาพสนาม
            </div>
          </div>
          <div v-if="gallery.length" class="field-gallery">
            <button
              v-for="g in gallery"
              :key="g"
              type="button"
              class="thumb-wrapper"
              :class="{ active: mainImage === g }"
              @click="mainImage = g"
            >
              <img :src="g" alt="thumbnail" />
            </button>
          </div>
        </div>

        <section class="field-info">
          <div class="info-card">
            <h2>ข้อมูลสนาม</h2>
            <ul>
              <li>
                <span>ประเภทกีฬา</span>
                <strong>{{ field.sportType || '-' }}</strong>
              </li>
              <li>
                <span>ความจุโดยประมาณ</span>
                <strong>{{ field.capacity || '-' }} คน</strong>
              </li>
              <li>
                <span>รหัสสนาม</span>
                <strong>#{{ field.id }}</strong>
              </li>
            </ul>
          </div>
        </section>

        <div class="actions-row">
          <button class="secondary-btn" @click="navigateTo('/fields')">
            ← กลับไปหน้าค้นหาสนาม
          </button>
          <button class="primary-outline-btn" @click="bookNow">
            จองสนามนี้
          </button>
        </div>

        <section class="calendar-section">
          <h2>ตารางการจอง</h2>
          <p class="calendar-helper">
            เลือกวันที่และช่วงเวลาว่าง จากนั้นกดปุ่ม
            <strong>จองสนามนี้</strong>
            เพื่อไปยังหน้ากรอกข้อมูลการจอง
          </p>
          <calendar-booking :field-id="field.id" />
        </section>
      </section>
    </div>
  </div>
</template>

<script>
import Api from '@/services/Api';
import FieldService from '@/services/FieldService';
import { io as ioClient } from 'socket.io-client';
import CalendarBooking from './CalendarBooking.vue';

export default {
  data () {
    return {
      field: {},
      mainImage: '',
      gallery: [],
      bookings: []
    }
  },
  async created () {
    try {
      var fieldId = this.$route.params.fieldId
      this.field = (await FieldService.show(fieldId)).data
      this.mainImage = this.field.image || ''
      try {
        if (this.field.gallery) this.gallery = typeof this.field.gallery === 'string' ? JSON.parse(this.field.gallery) : this.field.gallery
      } catch (e) {
        this.gallery = []
      }
      // load availability for next 7 days
      try {
        const api = Api()
        const now = new Date()
        const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const r = await api.get(`field/${fieldId}/availability`, { params: { start: now.toISOString(), end: until.toISOString() } })
        this.bookings = r.data || []
      } catch (e) {
        // ignore
      }
      // connect socket for realtime updates
      try {
        this.socket = ioClient()
        this.socket.on('booking:created', (b) => {
          if (b.fieldId === this.field.id) this.bookings.push(b)
        })
        this.socket.on('booking:updated', (b) => {
          const idx = this.bookings.findIndex(x => x.id === b.id)
          if (idx !== -1) this.bookings.splice(idx, 1, b)
          else if (b.fieldId === this.field.id) this.bookings.push(b)
        })
        this.socket.on('booking:deleted', (payload) => {
          const idx = this.bookings.findIndex(x => x.id === payload.id)
          if (idx !== -1) this.bookings.splice(idx, 1)
        })
      } catch (e) {
        // ignore socket errors
      }
    } catch (err) {
      console.log(err)
    }
  },
  methods: {
    navigateTo (route) {
      this.$router.push(route)
    }
    ,
    bookNow () {
      // navigate to booking create with field preselected
      this.$router.push({ name: 'booking-create', query: { fieldId: this.field.id } })
    }
  },
  beforeUnmount () {
    try { if (this.socket) this.socket.disconnect() } catch (e) {}
  }
}
</script>

<style scoped>
.field-page {
  padding: 1.25rem 1rem 2.5rem;
}

.field-layout {
  max-width: 1120px;
  margin: 0 auto;
}

.field-main {
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12);
  padding: 1.6rem 1.6rem 1.8rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.4rem;
}

.field-sport {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #059669;
}

.field-title {
  margin-top: 0.3rem;
  font-size: 1.6rem;
  font-weight: 800;
  color: #0f172a;
}

.field-location {
  margin-top: 0.25rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field-price {
  text-align: right;
}

.price-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #6b7280;
}

.price-value {
  margin-top: 0.15rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: #16a34a;
}

.primary-btn {
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
  border: none;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #ecfdf5;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.6);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #16a34a, #15803d);
}

.field-media {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.3rem;
}

.field-image-main {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 1.25rem;
  overflow: hidden;
  background: #0f172a;
}

.field-image-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.field-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
  background: repeating-linear-gradient(
    45deg,
    #111827,
    #111827 10px,
    #020617 10px,
    #020617 20px
  );
}

.field-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.thumb-wrapper {
  border-radius: 0.6rem;
  padding: 0;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  width: 96px;
  height: 72px;
}

.thumb-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-wrapper.active {
  border-color: #2563eb;
}

.field-info {
  margin-top: 0.75rem;
}

.info-card {
  border-radius: 1rem;
  background: #f9fafb;
  padding: 0.9rem 1rem;
}

.info-card h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
}

.info-card li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.2rem 0;
  color: #4b5563;
}

.info-card li strong {
  color: #111827;
}

.actions-row {
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.secondary-btn,
.primary-outline-btn {
  border-radius: 999px;
  padding: 0.5rem 1.1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #374151;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

.primary-outline-btn {
  border: 1px solid #22c55e;
  color: #16a34a;
  background: #ecfdf5;
}

.primary-outline-btn:hover {
  background: #bbf7d0;
}

.calendar-section {
  margin-top: 1.4rem;
}

.calendar-section h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.calendar-helper {
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: #6b7280;
}

@media (max-width: 768px) {
  .field-main {
    padding-inline: 1.1rem;
  }

  .field-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-meta {
    align-self: stretch;
    justify-content: space-between;
  }

  .actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .secondary-btn,
  .primary-outline-btn {
    width: 100%;
    text-align: center;
  }
}
</style>

