const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const KEY = "snd_flowerbox_orders_v1";
let orders = JSON.parse(localStorage.getItem(KEY) || "[]");
let current = null;

function nextOrderNo(){
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const count = orders.filter(o=>o.id.includes(`SND-${date}`)).length + 1;
  return `SND-${date}-${String(count).padStart(3,"0")}`;
}
function updateOrderNo(){ $("orderNo").textContent = nextOrderNo(); }
function val(id){ return $(id).value; }
function num(id){ return Number($(id).value)||0; }
function calculate(){
  const total = num("rent")+num("sashCost")+num("delivery");
  const dp = Math.min(num("dp"),total);
  $("total").textContent = money(total);
  $("balance").textContent = money(total-dp);
  if(num("dp")>total) $("dp").value=total;
}
["rent","sashCost","delivery","dp"].forEach(id=>$(id).addEventListener("input",calculate));

$("sash").addEventListener("change",()=>{
  if(val("sash")==="Tidak") $("sashCost").value=0;
  calculate();
});
$("product").addEventListener("change",()=>{
  const prices={
    "Akrilik Bulat Putih":150000,"Akrilik Bulat Hitam":150000,
    "Kubah Putih":150000,"Kubah Hitam":150000,"Ring Besi":120000,"Custom":0
  };
  $("rent").value=prices[val("product")]||0; calculate();
});

function getFormData(){
  const total=num("rent")+num("sashCost")+num("delivery");
  const dp=Math.min(num("dp"),total);
  return {
    id: current?.id || nextOrderNo(),
    createdAt: current?.createdAt || new Date().toISOString(),
    customer:val("customer").trim(), phone:val("phone").trim(),
    product:val("product"), rent:num("rent"),
    startDate:val("startDate"), endDate:val("endDate"),
    sash:val("sash"), sashCost:num("sashCost"), delivery:num("delivery"),
    message:val("message").trim(), notes:val("notes").trim(),
    dp, total, balance:total-dp,
    status: dp>=total && total>0 ? "Lunas" : dp>0 ? "DP" : "Belum Bayar"
  };
}
function saveOrders(){localStorage.setItem(KEY,JSON.stringify(orders));}
function validateDates(){
  if(val("startDate") && val("endDate") && val("endDate")<val("startDate")){
    alert("Tanggal pengambilan tidak boleh lebih awal dari tanggal kirim."); return false;
  } return true;
}
function conflict(data){
  return orders.some(o=>o.id!==data.id && o.product===data.product &&
    !(data.endDate < o.startDate || data.startDate > o.endDate));
}
$("orderForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(!validateDates()) return;
  const data=getFormData();
  if(conflict(data) && !confirm("Papan tersebut sudah memiliki pesanan pada rentang tanggal ini. Simpan tetap?")) return;
  const i=orders.findIndex(o=>o.id===data.id);
  if(i>=0) orders[i]=data; else orders.unshift(data);
  saveOrders(); current=data; render(); openReceipt(data);
  $("orderForm").reset(); $("rent").value=0; $("sashCost").value=0; $("delivery").value=0; $("dp").value=0;
  current=null; updateOrderNo(); calculate();
});
$("previewBtn").addEventListener("click",()=>{
  if(!$("customer").value || !$("product").value || !$("message").value){alert("Isi minimal nama, papan, dan tulisan terlebih dahulu.");return}
  if(!validateDates())return; openReceipt(getFormData());
});
$("newBtn").addEventListener("click",()=>{current=null;$("orderForm").reset();$("rent").value=0;$("sashCost").value=0;$("delivery").value=0;$("dp").value=0;updateOrderNo();calculate()});
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))$("modal").classList.add("hidden")});

function render(){
  const q=$("search").value.toLowerCase();
  const list=orders.filter(o=>`${o.id} ${o.customer} ${o.phone} ${o.product}`.toLowerCase().includes(q));
  $("history").innerHTML=list.length?list.map(o=>`
    <div class="item">
      <div class="item-top"><strong>${esc(o.id)}</strong><span class="status ${o.status==="Lunas"?"paid":o.status==="DP"?"dp":"unpaid"}">${esc(o.status)}</span></div>
      <small>${esc(o.customer)} • ${esc(o.product)}</small>
      <small>${formatDate(o.startDate)} → ${formatDate(o.endDate)} • <b>${money(o.total)}</b></small>
      <div class="item-actions"><button class="mini view" onclick="viewOrder('${o.id}')">Lihat / Nota</button><button class="mini view" onclick="editOrder('${o.id}')">Edit</button><button class="mini del" onclick="deleteOrder('${o.id}')">Hapus</button></div>
    </div>`).join(""):`<div class="empty">Belum ada transaksi.</div>`;
  const revenue=orders.reduce((s,o)=>s+o.total,0);
  $("statOrders").textContent=orders.length;$("statRevenue").textContent=money(revenue);
  $("statUnpaid").textContent=orders.filter(o=>o.status!=="Lunas").length;
  const today=new Date().toISOString().slice(0,10);
  $("statRented").textContent=orders.filter(o=>o.startDate<=today&&o.endDate>=today&&o.status!=="Belum Bayar").length;
}
function viewOrder(id){const o=orders.find(x=>x.id===id);if(o)openReceipt(o)}
function editOrder(id){
  const o=orders.find(x=>x.id===id);if(!o)return;current=o;
  ["customer","phone","product","rent","startDate","endDate","sash","sashCost","delivery","dp","message","notes"].forEach(k=>$(k).value=o[k]??"");
  calculate();window.scrollTo({top:0,behavior:"smooth"});
}
function deleteOrder(id){
  if(confirm("Hapus transaksi ini?")){orders=orders.filter(o=>o.id!==id);saveOrders();render();updateOrderNo()}
}
$("search").addEventListener("input",render);
$("clearAllBtn").addEventListener("click",()=>{
  if(confirm("Hapus SEMUA data transaksi dari browser ini?")){orders=[];saveOrders();render();updateOrderNo()}
});

function openReceipt(o){
  current=o;
  $("receipt").innerHTML=`
    <div class="receipt-head"><h2>🌸 SnD FlowerBox Ponorogo</h2><p>Nota Penyewaan Papan Bunga</p></div>
    <div class="receipt-row"><span>No. Pesanan</span><b>${esc(o.id)}</b></div>
    <div class="receipt-row"><span>Tanggal</span><b>${formatDateTime(o.createdAt)}</b></div>
    <div class="receipt-row"><span>Pelanggan</span><b>${esc(o.customer)}</b></div>
    <div class="receipt-row"><span>WhatsApp</span><b>${esc(o.phone)}</b></div>
    <div class="receipt-row"><span>Papan</span><b>${esc(o.product)}</b></div>
    <div class="receipt-row"><span>Tanggal kirim</span><b>${formatDate(o.startDate)}</b></div>
    <div class="receipt-row"><span>Tanggal ambil</span><b>${formatDate(o.endDate)}</b></div>
    <div class="receipt-message">${esc(o.message)}</div>
    <div class="receipt-row"><span>Selendang</span><b>${esc(o.sash)}</b></div>
    <div class="receipt-row"><span>Harga sewa</span><b>${money(o.rent)}</b></div>
    <div class="receipt-row"><span>Selendang</span><b>${money(o.sashCost)}</b></div>
    <div class="receipt-row"><span>Pengiriman</span><b>${money(o.delivery)}</b></div>
    <div class="receipt-total">
      <div class="receipt-row receipt-grand"><span>TOTAL</span><b>${money(o.total)}</b></div>
      <div class="receipt-row"><span>DP</span><b>${money(o.dp)}</b></div>
      <div class="receipt-row"><span>SISA</span><b>${money(o.balance)}</b></div>
      <div class="receipt-row receipt-status-row ${o.status==="Lunas"?"is-paid":""}">
        <span>Status</span><b>${esc(o.status)}</b>
      </div>
    </div>
    ${o.notes?`<div class="receipt-message"><b>Catatan:</b><br>${esc(o.notes)}</div>`:""}
    <div class="receipt-foot">Terima kasih telah menggunakan jasa SnD FlowerBox Ponorogo 🙏<br>Mohon simpan nota ini sebagai bukti pesanan.</div>`;
  $("modal").classList.remove("hidden");
}
async function makeReceiptBlob(){
  if(!current)return null;
  const receipt = $("receipt");
  const originalWidth = receipt.style.width;
  receipt.style.width = "603px";
  try{
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const rect = receipt.getBoundingClientRect();
    const targetWidth = 603;
    const scale = targetWidth / rect.width;
    const canvas = await html2canvas(receipt,{
      scale: Math.max(1, scale),
      backgroundColor:"#fff",
      useCORS:true,
      logging:false,
      width: rect.width,
      height: rect.height,
      windowWidth: Math.ceil(rect.width),
      windowHeight: Math.ceil(rect.height)
    });
    return await new Promise(resolve=>canvas.toBlob(resolve,"image/png",1));
  }finally{
    receipt.style.width = originalWidth;
  }
}

$("downloadBtn").addEventListener("click",async()=>{
  if(!current)return;
  try{
    const blob=await makeReceiptBlob();
    if(!blob)throw new Error("Gagal membuat gambar nota");
    const filename=`SnDFlowerBoxPonorogo-${current.id}.png`;
    const file=new File([blob],filename,{type:"image/png"});

    // Android/iPhone: gunakan Share Sheet bila tersedia.
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:"Nota SnD FlowerBox Ponorogo"});
      return;
    }

    // Fallback browser: Blob URL lebih kompatibel di HP daripada dataURL.
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=filename;
    a.target="_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch(err){
    if(err.name!=="AbortError") alert("Gambar nota gagal dibuat. Coba lagi atau gunakan tombol Kirim WhatsApp.");
  }
});

$("waBtn").addEventListener("click",async()=>{
  if(!current)return;
  try{
    const blob=await makeReceiptBlob();
    const filename=`Nota-SnDFlowerBox-${current.id}.png`;
    const file=new File([blob],filename,{type:"image/png"});
    const text=`Halo Kak, berikut nota pesanan SnD FlowerBox Ponorogo.\nNo. Pesanan: ${current.id}\nNama: ${current.customer}\nTotal: ${money(current.total)}\nDP: ${money(current.dp)}\nSisa: ${money(current.balance)}\nStatus: ${current.status}`;

    // Di HP, ini membuka menu berbagi sehingga WhatsApp bisa dipilih
    // dan gambar nota ikut terlampir.
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({files:[file],text,title:"Nota SnD FlowerBox Ponorogo"});
      return;
    }

    // Fallback bila browser tidak mendukung berbagi file.
    let phone=current.phone.replace(/\D/g,"");
    if(phone.startsWith("0"))phone="62"+phone.slice(1);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,"_blank");
  }catch(err){
    if(err.name!=="AbortError") alert("WhatsApp tidak dapat dibuka dari browser ini. Gunakan Download Gambar lalu bagikan PNG dari Galeri.");
  }
});
function formatDate(s){if(!s)return"-";return new Date(s+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"})}
function formatDateTime(s){return new Date(s).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
updateOrderNo();render();calculate();
