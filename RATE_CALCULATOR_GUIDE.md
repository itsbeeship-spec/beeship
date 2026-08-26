# 🚚 BeeShip Professional Rate Calculation Engine

Dedicated module: [`backend/src/utils/rateCalculatorEngine.js`](file:///c:/BeeShip/backend/src/utils/rateCalculatorEngine.js)

---

## 📐 Professional Industry Calculation Formula

### 1. Volumetric Weight Calculation
$$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Width (cm)} \times \text{Height (cm)}}{5000}$$

### 2. Chargable Weight
$$\text{Chargable Weight} = \max(\text{Physical Weight}, \text{Volumetric Weight})$$

### 3. Base Rate + Additional Rate Slab Formula (Shiprocket / Delhivery Model)
For a package requiring $N$ slabs of 0.5 kg ($N = \lceil \frac{\text{Weight}}{0.5} \rceil$):
- **First 0.5 kg (Slab 1)** $\rightarrow$ Charged at **`Base Rate`** (e.g. ₹40)
- **Extra Slabs ($N - 1$)** $\rightarrow$ Charged at **`Additional Rate`** (e.g. ₹25)

$$\text{Total Freight} = \text{Base Rate} + \left((N - 1) \times \text{Additional Rate}\right)$$

*Example (2.0 kg Parcel = 4 Slabs)*:
- Base Rate = ₹40, Additional Rate = ₹25
- Freight = $₹40 + (3 \times ₹25) = ₹40 + ₹75 =$ **₹115**

---

## ⚙️ How Price Changes Work In The Future?

1. **SuperAdmin Dynamic Control**:
   - SuperAdmin Panel me aap kisi bhi courier ya seller ke liye **Base Rate** aur **Additional Rate** dynamic control/change kar sakte hain.
2. **Instant Live Update**:
   - Jaise hi aap SuperAdmin me new price enter karke Save par click karte hain, database update ho jata hai aur system agle hi sec se naye updated rates se calculation karne lagta hai!
