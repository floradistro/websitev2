# AlpineIQ Phase-Out Plan 🎯

**Date:** 2025-11-09
**Timeline:** Phase out next week
**Status:** Planning

---

## 🎯 What We're Keeping

### 1. **Apple Wallet Pass** (Our Own)

- ✅ `lib/wallet/pass-generator.ts` (498 lines)
- ✅ Customer loyalty cards
- ✅ NO AlpineIQ dependency

### 2. **Customer/Points Sync** (Bulletproof for transition)

- ✅ Real-time customer sync
- ✅ Order sync for loyalty points
- ✅ Must work flawlessly until AlpineIQ is fully removed

---

## ❌ What We're Removing (Next Week)

### AlpineIQ Marketing Features

- ❌ Campaign management (we do this ourselves now)
- ❌ SMS campaigns (we have our own)
- ❌ Email campaigns (we have our own)
- ❌ Marketing analytics (we track ourselves)

### AlpineIQ Files to Remove

```
lib/marketing/alpineiq-client.ts (885 lines) - REMOVE
lib/marketing/alpineiq-sync.ts (525 lines) - EXTRACT THEN REMOVE
lib/marketing/alpine-templates.ts - REMOVE
app/api/vendor/marketing/alpineiq/* - REMOVE
app/api/vendor/marketing/campaigns/* - REMOVE (if Alpine-only)
app/api/vendor/marketing/sms/campaigns/* - REMOVE (if Alpine-only)
```

---

## 🛡️ PRIORITY: Bulletproof Sync (This Session)

### Critical Functions to Preserve

From `alpineiq-sync.ts`:

1. **pushCustomerToAlpineIQ()** - Customer sync
2. **pushOrderToAlpineIQ()** - Order/points sync
3. **syncCustomer()** - Manual customer sync
4. **syncOrder()** - Manual order sync

### What Makes It Bulletproof

- ✅ Retry logic on failure
- ✅ Error handling & logging
- ✅ Change detection (don't re-sync unnecessarily)
- ✅ Real-time listeners
- ✅ Fallback mechanisms

---

## 📋 TODAY'S PLAN

### Phase 1: Refactor Wallet Pass Generator (SAFE)

```
lib/wallet/pass-generator.ts (498 lines)
  → lib/wallet/pass-generator/
      ├── index.ts
      ├── types.ts
      ├── generator.ts
      ├── templates.ts
      └── signing.ts
```

**Why:** Only 2 imports, isolated, critical for customer loyalty

### Phase 2: Extract & Bulletproof Sync

```
lib/marketing/alpineiq-sync.ts (525 lines)
  → lib/loyalty/sync/
      ├── index.ts (exports)
      ├── alpineiq-adapter.ts (Alpine-specific logic)
      ├── customer-sync.ts (customer sync logic)
      ├── order-sync.ts (order/points sync)
      └── types.ts
```

**Benefits:**

- ✅ Isolated Alpine code (easy to remove later)
- ✅ Clean sync logic (reusable for future loyalty systems)
- ✅ Bulletproof error handling
- ✅ Easy to swap out Alpine adapter next week

### Phase 3: Remove Alpine Marketing (Next Week)

```
# After sync is stable, remove:
- alpineiq-client.ts
- alpine-templates.ts
- Alpine marketing routes
- Campaign management (Alpine-specific)
```

---

## 🎯 Success Criteria

### This Session

- [x] Wallet pass generator refactored & tested
- [ ] Sync code extracted & bulletproofed
- [ ] All tests passing
- [ ] Customer sync works flawlessly
- [ ] Order sync works flawlessly

### Next Week

- [ ] Remove AlpineIQ marketing features
- [ ] Remove alpineiq-client.ts (885 lines deleted!)
- [ ] Update imports
- [ ] Tests still pass
- [ ] Customers don't notice anything

---

## 🚀 LET'S DO THIS

**Current Focus:** Refactor `lib/wallet/pass-generator.ts`
**Next:** Bulletproof the sync
**Future:** Remove Alpine marketing cruft

---

Ready to ROLL IT! 🔥
