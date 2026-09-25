const STORAGE_KEY = "snd_flowerbox_orders_v3";

const PRODUCT_LIST = [
  "Akrilik Bulat Putih",
  "Akrilik Bulat Hitam",
  "Kubah Putih",
  "Kubah Hitam",
  "Ring Besi",
  "Custom"
];

const $ = id => document.getElementById(id);

const form = $("orderForm");
const customer = $("customer");
const phone = $("phone");
const startDate = $("startDate");
const endDate = $("endDate");
const delivery = $("delivery");
const dp = $("dp");
const notes = $("notes");
const productsContainer = $("productsContainer");
const addProductBtn = $("addProductBtn");
const subtotalEl = $("subtotal");
const deliveryTotalEl = $("deliveryTotal");
const totalEl = $("total");
const paidTotalEl = $("paidTotal");
const balanceEl = $("balance");
const orderNoEl = $("orderNo");
const historyEl = $("history");
const searchEl = $("search");
const statusFilter = $("statusFilter");
const statOrders = $("statOrders");
const statRevenue = $("statRevenue");
const statUnpaid = $("statUnpaid");
const statRented = $("statRented");
const modal = $("modal");
const receipt = $("receipt");
const toast = $("toast");

let activeReceiptOrder = null;
let editingId = null;
let toastTimer = null;

function rupiah(value){
  return new Intl.NumberFormat("id-ID",{
    style:"currency",currency:"IDR",minimumFractionDigits:0
  }).format(Number(value)||0);
}

function numberValue(value){
  return Math.max(0, Number(value)||0);
}

function getOrders(){
  try{
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  }catch(e){
    return [];
  }
}

function saveOrders(orders){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function uid(){
  return Date.now() + Math.floor(Math.random()*1000);
}

function todayISO(){
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,10);
}

function formatDate(value){
  if(!value) return "-";
  const d = new Date(value+"T00:00:00");
  return d.toLocaleDateString("id-ID",{day:"2-digit",month:"2-digit",year:"numeric"});
}

function escapeHTML(value){
  return String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.remove("show"),2400);
}

function generateOrderNumber(){
  const orders = getOrders();
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  const prefix = `SND-${y}${m}${day}-`;
  const sameDay = orders.filter(o => String(o.orderNo||"").startsWith(prefix));
  return `${prefix}${String(sameDay.length+1).padStart(3,"0")}`;
}

function updateOrderNumber(){
  orderNoEl.textContent = editingId ? "MODE EDIT" : generateOrderNumber();
}

function addProductRow(data={}){
  const row = document.createElement("div");
  row.className = "product-row";

  const selected = data.name || "";
  const qty = data.quantity ?? 1;
  const price = data.price ?? 0;

  row.innerHTML = `
    <label class="product-name">
      Produk
      <select class="product-select">
        <option value="">Pilih produk</option>
        ${PRODUCT_LIST.map(p=>`<option value="${escapeHTML(p)}" ${p===selected?"selected":""}>${escapeHTML(p)}</option>`).join("")}
      </select>
    </label>
    <label>
      Jumlah
      <input class="product-qty" type="number" min="1" step="1" value="${qty}">
    </label>
    <label>
      Harga / produk
      <input class="product-price" type="number" min="0" step="1000" value="${price}" inputmode="numeric">
    </label>
    <label>
      Subtotal
      <input class="product-subtotal" type="text" value="${rupiah(qty*price)}" readonly>
    </label>
    <button type="button" class="btn btn-danger remove-product" title="Hapus produk">×</button>
  `;

  productsContainer.appendChild(row);

  const qtyEl = row.querySelector(".product-qty");
  const priceEl = row.querySelector(".product-price");
  const subtotalElRow = row.querySelector(".product-subtotal");

  const refresh = ()=>{
    const sub = numberValue(qtyEl.value) * numberValue(priceEl.value);
    subtotalElRow.value = rupiah(sub);
    calculateTotal();
  };

  qtyEl.addEventListener("input",refresh);
  priceEl.addEventListener("input",refresh);
  row.querySelector(".product-select").addEventListener("change",refresh);

  row.querySelector(".remove-product").addEventListener("click",()=>{
    const rows = productsContainer.querySelectorAll(".product-row");
    if(rows.length <= 1){
      row.querySelector(".product-select").value="";
      qtyEl.value=1;
      priceEl.value=0;
    }else{
      row.remove();
    }
    calculateTotal();
  });

  refresh();
}

function getProducts(){
  return [...productsContainer.querySelectorAll(".product-row")]
    .map(row=>{
      const name = row.querySelector(".product-select").value.trim();
      const quantity = Math.max(1,parseInt(row.querySelector(".product-qty").value)||1);
      const price = numberValue(row.querySelector(".product-price").value);
      return {name,quantity,price,subtotal:quantity*price};
    })
    .filter(p=>p.name);
}

function calculateTotal(){
  const products = getProducts();
  const subtotal = products.reduce((s,p)=>s+p.subtotal,0);
  const shipping = numberValue(delivery.value);
  const paid = numberValue(dp.value);
  const total = subtotal + shipping;
  const balance = Math.max(total-paid,0);

  subtotalEl.textContent = rupiah(subtotal);
  deliveryTotalEl.textContent = rupiah(shipping);
  totalEl.textContent = rupiah(total);
  paidTotalEl.textContent = rupiah(paid);
  balanceEl.textContent = rupiah(balance);

  return {products,subtotal,delivery:shipping,total,dp:paid,balance};
}

function resetForm(){
  editingId = null;
  form.reset();
  delivery.value=0;
  dp.value=0;
  productsContainer.innerHTML="";
  addProductRow();
  startDate.value=todayISO();
  endDate.value=todayISO();
  $("previewBtn").textContent="Preview Nota";
  $("newBtn").textContent="Kosongkan";
  updateOrderNumber();
  calculateTotal();
}

function validateForm(calc){
  if(!customer.value.trim()) return "Nama pelanggan wajib diisi.";
  if(!phone.value.trim()) return "Nomor WhatsApp wajib diisi.";
  if(!startDate.value || !endDate.value) return "Tanggal kirim dan tanggal ambil wajib diisi.";
  if(endDate.value < startDate.value) return "Tanggal ambil tidak boleh sebelum tanggal kirim.";
  if(calc.products.length===0) return "Tambahkan minimal satu produk.";
  if(calc.total<=0) return "Total pesanan harus lebih dari Rp 0.";
  if(calc.dp>calc.total) return "DP tidak boleh lebih besar dari total.";
  return "";
}

form.addEventListener("submit",e=>{
  e.preventDefault();
  const calc=calculateTotal();
  const error=validateForm(calc);
  if(error){alert(error);return;}

  const orders=getOrders();
  const existing=editingId ? orders.find(o=>o.id===editingId) : null;

  const order={
    id: editingId || uid(),
    orderNo: existing?.orderNo || orderNoEl.textContent,
    customer: customer.value.trim(),
    phone: phone.value.trim(),
    startDate: startDate.value,
    endDate: endDate.value,
    products: calc.products,
    subtotal: calc.subtotal,
    delivery: calc.delivery,
    total: calc.total,
    dp: calc.dp,
    balance: calc.balance,
    notes: notes.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if(editingId){
    const idx=orders.findIndex(o=>o.id===editingId);
    if(idx>=0) orders[idx]=order;
    showToast("Pesanan berhasil diperbarui.");
  }else{
    orders.unshift(order);
    showToast("Pesanan berhasil dibuat.");
  }

  saveOrders(orders);
  activeReceiptOrder=order;
  showReceipt(order);
  resetForm();
  renderHistory();
  updateStats();
});

addProductBtn.addEventListener("click",()=>addProductRow());
delivery.addEventListener("input",calculateTotal);
dp.addEventListener("input",calculateTotal);

$("newBtn").addEventListener("click",()=>{
  if(editingId && !confirm("Batalkan mode edit dan kosongkan form?")) return;
  resetForm();
});

$("previewBtn").addEventListener("click",()=>{
  const calc=calculateTotal();
  if(calc.products.length===0){alert("Tambahkan minimal satu produk.");return;}
  activeReceiptOrder={
    id:null,
    orderNo:editingId ? orderNoEl.textContent : generateOrderNumber(),
    customer:customer.value.trim() || "-",
    phone:phone.value.trim() || "-",
    startDate:startDate.value,
    endDate:endDate.value,
    products:calc.products,
    subtotal:calc.subtotal,
    delivery:calc.delivery,
    total:calc.total,
    dp:calc.dp,
    balance:calc.balance,
    notes:notes.value.trim()
  };
  showReceipt(activeReceiptOrder);
});

function statusOf(order){
  const today=todayISO();
  if(Number(order.balance)>0 && order.startDate<=today && order.endDate>=today) return "rented";
  if(Number(order.balance)<=0) return "paid";
  return "unpaid";
}

function statusLabel(status){
  return {paid:"LUNAS",unpaid:"BELUM LUNAS",rented:"SEDANG DISEWA"}[status] || "BELUM LUNAS";
}

function renderHistory(){
  const keyword=searchEl.value.trim().toLowerCase();
  const filter=statusFilter.value;

  let orders=getOrders().filter(order=>{
    const products=(order.products||[]).map(p=>p.name).join(" ");
    const haystack=`${order.orderNo} ${order.customer} ${order.phone} ${products}`.toLowerCase();
    const status=statusOf(order);
    return haystack.includes(keyword) && (filter==="all" || filter===status);
  });

  if(!orders.length){
    historyEl.innerHTML=`<div class="empty"><div style="font-size:38px">📭</div><p>Tidak ada transaksi yang cocok.</p></div>`;
    return;
  }

  historyEl.innerHTML=orders.map(order=>{
    const status=statusOf(order);
    const productText=(order.products||[]).map(p=>`${escapeHTML(p.name)} (${p.quantity}x)`).join(" • ");
    return `
      <div class="history-item">
        <div class="history-main">
          <div>
            <strong>${escapeHTML(order.customer)}</strong>
            <span class="order-small">${escapeHTML(order.orderNo)}</span>
          </div>
          <span class="status ${status}">${statusLabel(status)}</span>
        </div>
        <div class="history-info">
          <span>📱 ${escapeHTML(order.phone)}</span>
          <span class="product-summary">🌸 ${productText}</span>
          <span>📅 ${formatDate(order.startDate)} - ${formatDate(order.endDate)}</span>
          <strong>${rupiah(order.total)} ${order.balance>0?`• Sisa ${rupiah(order.balance)}`:""}</strong>
        </div>
        <div class="history-actions">
          <button class="btn btn-secondary" onclick="viewOrder(${order.id})">Nota</button>
          <button class="btn btn-light" onclick="editOrder(${order.id})">Edit</button>
          <button class="btn btn-wa" onclick="sendWhatsApp(${order.id})">WhatsApp</button>
          <button class="btn btn-danger" onclick="deleteOrder(${order.id})">Hapus</button>
        </div>
      </div>
    `;
  }).join("");
}

searchEl.addEventListener("input",renderHistory);
statusFilter.addEventListener("change",renderHistory);

function showReceipt(order){
  activeReceiptOrder=order;
  const status=statusOf(order);

  const rows=(order.products||[]).map((p,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${escapeHTML(p.name)}</td>
      <td>${p.quantity}</td>
      <td>${rupiah(p.price)}</td>
      <td>${rupiah(p.subtotal)}</td>
    </tr>
  `).join("");

  receipt.innerHTML=`
    <div class="receipt-header">
     <img src="sndlogo1.png" alt="SnD.flowerboxponorogo">
      <p>INVOICE</p>
    </div>
    <div class="receipt-line"></div>
    <div class="receipt-number">
      <strong>${escapeHTML(order.orderNo)}</strong>
      <strong>${statusLabel(status)}</strong>
    </div>
    <div class="receipt-section">
      <div><span>Pelanggan</span><strong>${escapeHTML(order.customer)}</strong></div>
      <div><span>WhatsApp</span><strong>${escapeHTML(order.phone)}</strong></div>
      <div><span>Tanggal Kirim</span><strong>${formatDate(order.startDate)}</strong></div>
      <div><span>Tanggal Ambil</span><strong>${formatDate(order.endDate)}</strong></div>
    </div>
    <table class="receipt-products">
      <thead><tr><th>No</th><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="receipt-line"></div>
    <div class="receipt-row"><span>Subtotal Produk</span><strong>${rupiah(order.subtotal)}</strong></div>
    <div class="receipt-row"><span>Pengiriman</span><strong>${rupiah(order.delivery)}</strong></div>
    <div class="receipt-row total-row"><span>TOTAL</span><strong>${rupiah(order.total)}</strong></div>
    <div class="receipt-row"><span>DP / Pembayaran</span><strong>${rupiah(order.dp)}</strong></div>
    <div class="receipt-row balance-row"><span>SISA</span><strong>${rupiah(order.balance)}</strong></div>
    ${order.notes?`<div class="receipt-notes"><strong>Catatan:</strong><p>${escapeHTML(order.notes)}</p></div>`:""}
    <div class="receipt-footer">
      <p>Terima kasih telah menggunakan</p>
      <strong>SnD.Flowerboxponorogo</strong>
    </div>
  `;
  modal.classList.remove("hidden");
}

function viewOrder(id){
  const order=getOrders().find(o=>o.id===id);
  if(!order){alert("Pesanan tidak ditemukan.");return;}
  showReceipt(order);
}

function editOrder(id){
  const order=getOrders().find(o=>o.id===id);
  if(!order){alert("Pesanan tidak ditemukan.");return;}

  editingId=id;
  customer.value=order.customer;
  phone.value=order.phone;
  startDate.value=order.startDate;
  endDate.value=order.endDate;
  delivery.value=order.delivery;
  dp.value=order.dp;
  notes.value=order.notes || "";
  productsContainer.innerHTML="";
  (order.products||[]).forEach(p=>addProductRow(p));
  if(!(order.products||[]).length)addProductRow();
  $("previewBtn").textContent="Preview Perubahan";
  $("newBtn").textContent="Batal Edit";
  updateOrderNumber();
  calculateTotal();
  window.scrollTo({top:0,behavior:"smooth"});
  showToast(`Mode edit ${order.orderNo}`);
}

function deleteOrder(id){
  const order=getOrders().find(o=>o.id===id);
  if(!order)return;
  if(!confirm(`Hapus pesanan ${order.orderNo} atas nama ${order.customer}?`))return;
  saveOrders(getOrders().filter(o=>o.id!==id));
  renderHistory();updateStats();updateOrderNumber();
  showToast("Pesanan dihapus.");
}

function normalizePhone(value){
  let n=String(value||"").replace(/\D/g,"");
  if(n.startsWith("0"))n="62"+n.slice(1);
  if(!n.startsWith("62"))n="62"+n;
  return n;
}

function createWhatsAppMessage(order){
  const products=(order.products||[]).map((p,i)=>
    `${i+1}. ${p.name}\n   ${p.quantity} x ${rupiah(p.price)} = ${rupiah(p.subtotal)}`
  ).join("\n");

  return `Halo Kak ${order.customer} 👋

Terima kasih sudah melakukan pemesanan di *SnD.flowerboxponorogo* 🌸

🧾 *DETAIL PESANAN*
No. Pesanan: ${order.orderNo}

🌸 *PRODUK*
${products}

📅 Tanggal kirim: ${formatDate(order.startDate)}
📅 Tanggal ambil: ${formatDate(order.endDate)}

💰 Subtotal: ${rupiah(order.subtotal)}
🚚 Pengiriman: ${rupiah(order.delivery)}
💵 *TOTAL: ${rupiah(order.total)}*
💳 Pembayaran: ${rupiah(order.dp)}
📌 Sisa: ${rupiah(order.balance)}

Status: *${statusLabel(statusOf(order))}*
${order.notes?`\n📝 Catatan: ${order.notes}`:""}

Terima kasih 🙏
*SnD FlowerBox Ponorogo* 🌸`;
}

function sendWhatsApp(id){
  const order=getOrders().find(o=>o.id===id);
  if(!order){alert("Pesanan tidak ditemukan.");return;}
  const url=`https://wa.me/${normalizePhone(order.phone)}?text=${encodeURIComponent(createWhatsAppMessage(order))}`;
  window.open(url,"_blank");
}

$("waBtn").addEventListener("click",()=>{
  if(!activeReceiptOrder)return;
  const order=activeReceiptOrder.id ? getOrders().find(o=>o.id===activeReceiptOrder.id) : activeReceiptOrder;
  if(!order || !order.phone){alert("Nomor WhatsApp belum diisi.");return;}
  window.open(`https://wa.me/${normalizePhone(order.phone)}?text=${encodeURIComponent(createWhatsAppMessage(order))}`,"_blank");
});

function printReceipt(){
  if(!activeReceiptOrder)return;
  const win=window.open("","_blank","width=700,height=900");
  if(!win){alert("Popup diblokir browser. Izinkan popup untuk mencetak nota.");return;}
  win.document.write(`<!DOCTYPE html><html><head><title>${escapeHTML(activeReceiptOrder.orderNo)}</title>
  <style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:25px;color:#222}.receipt{max-width:620px;margin:auto}
  .receipt-header{text-align:center}.receipt-header h1{font-size:22px;margin:0}.receipt-header p{font-size:12px;color:#777}
  .receipt-line{border-top:1px dashed #888;margin:14px 0}.receipt-number,.receipt-row{display:flex;justify-content:space-between}
  .receipt-number{font-size:11px}.receipt-section{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:15px 0}
  .receipt-section span{display:block;color:#888;font-size:9px}.receipt-section strong{font-size:11px}
  table{width:100%;border-collapse:collapse}th,td{padding:7px 4px;border-bottom:1px solid #ddd;font-size:9px;text-align:left}th:last-child,td:last-child{text-align:right}
  .receipt-row{padding:6px 0;font-size:10px}.total-row{border-top:1px solid #222;margin-top:4px;padding-top:10px;font-size:16px}.balance-row{font-size:14px;font-weight:bold}
  .receipt-notes{background:#f7f7f7;padding:8px;margin-top:10px;font-size:10px}.receipt-footer{text-align:center;margin-top:25px;font-size:10px;color:#777}
  </style></head><body><div class="receipt">${receipt.innerHTML}</div><script>window.onload=()=>window.print();<\/script></body></html>`);
  win.document.close();
}
$("printBtn").addEventListener("click",printReceipt);

$("downloadBtn").addEventListener("click",async()=>{
  if(!activeReceiptOrder)return;
  if(typeof html2canvas==="undefined"){alert("Library gambar belum tersedia. Pastikan internet aktif.");return;}
  try{
    const canvas=await html2canvas(receipt,{scale:2,backgroundColor:"#fff",useCORS:true});
    const a=document.createElement("a");
    a.download=`${activeReceiptOrder.orderNo}.png`;
    a.href=canvas.toDataURL("image/png");
    a.click();
  }catch(e){console.error(e);alert("Gagal membuat gambar nota.");}
});

$("closeModal").addEventListener("click",()=>modal.classList.add("hidden"));
$("closeReceiptBtn").addEventListener("click",()=>modal.classList.add("hidden"));
modal.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});

function updateStats(){
  const orders=getOrders();
  const revenue=orders.reduce((s,o)=>s+numberValue(o.dp),0);
  const unpaid=orders.filter(o=>numberValue(o.balance)>0).length;
  const rented=orders.filter(o=>statusOf(o)==="rented").length;
  statOrders.textContent=orders.length;
  statRevenue.textContent=rupiah(revenue);
  statUnpaid.textContent=unpaid;
  statRented.textContent=rented;
}

$("clearAllBtn").addEventListener("click",()=>{
  const orders=getOrders();
  if(!orders.length){showToast("Belum ada data transaksi.");return;}
  if(!confirm("SEMUA data transaksi akan dihapus. Lanjutkan?"))return;
  localStorage.removeItem(STORAGE_KEY);
  resetForm();renderHistory();updateStats();
  showToast("Semua data berhasil direset.");
});

$("exportBtn").addEventListener("click",()=>{
  const data=getOrders();
  if(!data.length){showToast("Belum ada data untuk dibackup.");return;}
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`backup-snd-flowerbox-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Backup data berhasil dibuat.");
});

$("importInput").addEventListener("change",e=>{
  const file=e.target.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      if(!Array.isArray(data))throw new Error("Format bukan array");
      const valid=data.filter(o=>o && o.orderNo && Array.isArray(o.products));
      if(!valid.length)throw new Error("Data transaksi tidak valid");
      if(!confirm(`Import ${valid.length} transaksi? Data lama akan digabung.`))return;
      const current=getOrders();
      const ids=new Set(current.map(o=>o.id));
      valid.forEach(o=>{if(!ids.has(o.id))current.push(o);});
      current.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
      saveOrders(current);renderHistory();updateStats();updateOrderNumber();
      showToast("Data berhasil diimport.");
    }catch(err){alert("File backup tidak valid.");}
    e.target.value="";
  };
  reader.readAsText(file);
});

document.addEventListener("DOMContentLoaded",()=>{
  startDate.value=todayISO();
  endDate.value=todayISO();
  addProductRow();
  updateOrderNumber();
  calculateTotal();
  renderHistory();
  updateStats();
});
