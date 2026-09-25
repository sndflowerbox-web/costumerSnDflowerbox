// ==========================================
// SnD FlowerBox Ponorogo
// SISTEM KASIR MULTI PRODUK
// ==========================================

const STORAGE_KEY = "snd_flowerbox_orders";


// ==========================================
// PRODUK DEFAULT
// ==========================================

const productList = [
    "Akrilik Bulat Putih",
    "Akrilik Bulat Hitam",
    "Kubah Putih",
    "Kubah Hitam",
    "Ring Besi",
    "Custom"
];


// ==========================================
// ELEMENT
// ==========================================

const form = document.getElementById("orderForm");

const customer = document.getElementById("customer");
const phone = document.getElementById("phone");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");

const delivery = document.getElementById("delivery");
const dp = document.getElementById("dp");

const notes = document.getElementById("notes");

const productsContainer =
    document.getElementById("productsContainer");

const addProductBtn =
    document.getElementById("addProductBtn");

const subtotalEl =
    document.getElementById("subtotal");

const deliveryTotalEl =
    document.getElementById("deliveryTotal");

const totalEl =
    document.getElementById("total");

const paidTotalEl =
    document.getElementById("paidTotal");

const balanceEl =
    document.getElementById("balance");

const orderNoEl =
    document.getElementById("orderNo");

const historyEl =
    document.getElementById("history");

const searchEl =
    document.getElementById("search");

const statOrders =
    document.getElementById("statOrders");

const statRevenue =
    document.getElementById("statRevenue");

const statUnpaid =
    document.getElementById("statUnpaid");

const statRented =
    document.getElementById("statRented");

const modal =
    document.getElementById("modal");

const receipt =
    document.getElementById("receipt");


// ==========================================
// FORMAT RUPIAH
// ==========================================

function rupiah(value) {

    return new Intl.NumberFormat("id-ID", {

        style: "currency",

        currency: "IDR",

        minimumFractionDigits: 0

    }).format(Number(value) || 0);

}


// ==========================================
// LOCAL STORAGE
// ==========================================

function getOrders() {

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || [];

    } catch {

        return [];

    }

}


function saveOrders(orders) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(orders)
    );

}


// ==========================================
// ORDER NUMBER
// ==========================================

function generateOrderNumber() {

    const orders = getOrders();

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
        .padStart(2, "0");

    const day =
        String(now.getDate())
        .padStart(2, "0");

    const number =
        String(orders.length + 1)
        .padStart(3, "0");

    return `SND-${year}${month}${day}-${number}`;

}


function updateOrderNumber() {

    orderNoEl.textContent =
        generateOrderNumber();

}


// ==========================================
// TAMBAH PRODUK
// ==========================================

function addProductRow(
    selectedProduct = "",
    quantity = 1,
    price = 0
) {

    const row =
        document.createElement("div");

    row.className = "product-row";


    row.innerHTML = `

        <label class="product-name">

            Produk

            <select class="product-select">

                <option value="">
                    Pilih produk
                </option>

                ${productList.map(product => `
                    <option
                        value="${product}"
                        ${product === selectedProduct ? "selected" : ""}>
                        ${product}
                    </option>
                `).join("")}

            </select>

        </label>


        <label>

            Jumlah

            <input
                type="number"
                class="product-qty"
                min="1"
                value="${quantity}">

        </label>


        <label>

            Harga / produk

            <input
                type="number"
                class="product-price"
                min="0"
                value="${price}">

        </label>


        <label>

            Subtotal

            <input
                type="text"
                class="product-subtotal"
                value="${rupiah(quantity * price)}"
                readonly>

        </label>


        <button
            type="button"
            class="btn btn-danger remove-product">

            × Hapus

        </button>

    `;


    productsContainer.appendChild(row);


    // Event input
    const qty =
        row.querySelector(".product-qty");

    const priceInput =
        row.querySelector(".product-price");

    const subtotal =
        row.querySelector(".product-subtotal");


    function updateRow() {

        const jumlah =
            Number(qty.value) || 0;

        const harga =
            Number(priceInput.value) || 0;

        subtotal.value =
            rupiah(jumlah * harga);

        calculateTotal();

    }


    qty.addEventListener(
        "input",
        updateRow
    );

    priceInput.addEventListener(
        "input",
        updateRow
    );


    // Hapus
    row.querySelector(".remove-product")
        .addEventListener("click", function () {

            row.remove();

            calculateTotal();

        });


    calculateTotal();

}


// ==========================================
// AMBIL DATA PRODUK
// ==========================================

function getProducts() {

    const rows =
        productsContainer.querySelectorAll(
            ".product-row"
        );


    const products = [];


    rows.forEach(row => {

        const name =
            row.querySelector(
                ".product-select"
            ).value;

        const quantity =
            Number(
                row.querySelector(
                    ".product-qty"
                ).value
            ) || 0;

        const price =
            Number(
                row.querySelector(
                    ".product-price"
                ).value
            ) || 0;


        if (name) {

            products.push({

                name,

                quantity,

                price,

                subtotal:
                    quantity * price

            });

        }

    });


    return products;

}


// ==========================================
// HITUNG TOTAL
// ==========================================

function calculateTotal() {

    const products =
        getProducts();


    // Total semua produk
    const subtotal =
        products.reduce(
            (total, product) =>
                total + product.subtotal,
            0
        );


    const biayaKirim =
        Number(delivery.value) || 0;


    const pembayaran =
        Number(dp.value) || 0;


    const total =
        subtotal + biayaKirim;


    const balance =
        Math.max(
            total - pembayaran,
            0
        );


    subtotalEl.textContent =
        rupiah(subtotal);


    deliveryTotalEl.textContent =
        rupiah(biayaKirim);


    totalEl.textContent =
        rupiah(total);


    paidTotalEl.textContent =
        rupiah(pembayaran);


    balanceEl.textContent =
        rupiah(balance);


    return {

        products,

        subtotal,

        delivery: biayaKirim,

        total,

        dp: pembayaran,

        balance

    };

}


// ==========================================
// EVENT
// ==========================================

addProductBtn.addEventListener(
    "click",
    function () {

        addProductRow();

    }
);


delivery.addEventListener(
    "input",
    calculateTotal
);


dp.addEventListener(
    "input",
    calculateTotal
);


// ==========================================
// SIMPAN TRANSAKSI
// ==========================================

form.addEventListener(
    "submit",
    function (e) {

        e.preventDefault();


        const calculation =
            calculateTotal();


        if (!customer.value.trim()) {

            alert(
                "Nama pelanggan wajib diisi."
            );

            return;

        }


        if (!phone.value.trim()) {

            alert(
                "Nomor WhatsApp wajib diisi."
            );

            return;

        }


        if (!startDate.value ||
            !endDate.value) {

            alert(
                "Tanggal kirim dan tanggal ambil wajib diisi."
            );

            return;

        }


        if (endDate.value <
            startDate.value) {

            alert(
                "Tanggal ambil tidak boleh sebelum tanggal kirim."
            );

            return;

        }


        if (calculation.products.length === 0) {

            alert(
                "Tambahkan minimal satu produk."
            );

            return;

        }


        if (calculation.dp >
            calculation.total) {

            alert(
                "Pembayaran tidak boleh lebih besar dari total."
            );

            return;

        }


        const order = {

            id: Date.now(),

            orderNo:
                orderNoEl.textContent,

            customer:
                customer.value.trim(),

            phone:
                phone.value.trim(),

            startDate:
                startDate.value,

            endDate:
                endDate.value,

            products:
                calculation.products,

            subtotal:
                calculation.subtotal,

            delivery:
                calculation.delivery,

            total:
                calculation.total,

            dp:
                calculation.dp,

            balance:
                calculation.balance,

            notes:
                notes.value.trim(),

            createdAt:
                new Date().toISOString()

        };


        const orders =
            getOrders();


        orders.unshift(order);


        saveOrders(orders);


        alert(
            `Pesanan ${order.orderNo} berhasil disimpan.`
        );


        showReceipt(order);


        resetForm();

        renderHistory();

        updateStats();

    }
);


// ==========================================
// RESET FORM
// ==========================================

function resetForm() {

    form.reset();


    productsContainer.innerHTML = "";


    delivery.value = 0;

    dp.value = 0;


    addProductRow();


    calculateTotal();


    updateOrderNumber();

}


document.getElementById(
    "newBtn"
).addEventListener(
    "click",
    resetForm
);


// ==========================================
// FORMAT TANGGAL
// ==========================================

function formatDate(value) {

    if (!value) return "-";


    const date =
        new Date(
            value + "T00:00:00"
        );


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// RIWAYAT
// ==========================================

function renderHistory(keyword = "") {

    const orders =
        getOrders();


    const search =
        keyword.toLowerCase();


    const filtered =
        orders.filter(order => {

            const productNames =
                order.products
                    .map(p => p.name)
                    .join(" ");


            const text = `

                ${order.orderNo}
                ${order.customer}
                ${order.phone}
                ${productNames}

            `.toLowerCase();


            return text.includes(search);

        });


    if (filtered.length === 0) {

        historyEl.innerHTML = `

            <div class="empty">

                <div style="font-size:40px">
                    📭
                </div>

                <p>
                    Belum ada transaksi.
                </p>

            </div>

        `;

        return;

    }


    historyEl.innerHTML =
        filtered.map(order => {

            const lunas =
                order.balance <= 0;


            const productsText =
                order.products
                    .map(
                        p =>
                        `${p.name} (${p.quantity}x)`
                    )
                    .join(", ");


            return `

                <div class="history-item">

                    <div class="history-main">

                        <div>

                            <strong>
                                ${escapeHTML(order.customer)}
                            </strong>

                            <span class="order-small">
                                ${escapeHTML(order.orderNo)}
                            </span>

                        </div>


                        <span class="status ${
                            lunas
                            ? "paid"
                            : "unpaid"
                        }">

                            ${
                                lunas
                                ? "LUNAS"
                                : "BELUM LUNAS"
                            }

                        </span>

                    </div>


                    <div class="history-info">

                        <span>
                            📱 ${escapeHTML(order.phone)}
                        </span>

                        <span>
                            🌸 ${escapeHTML(productsText)}
                        </span>

                        <span>
                            📅 ${formatDate(order.startDate)}
                            -
                            ${formatDate(order.endDate)}
                        </span>

                        <strong>
                            ${rupiah(order.total)}
                        </strong>

                    </div>


                    <div class="history-actions">

                        <button
                            class="btn btn-secondary"
                            onclick="viewOrder(${order.id})">

                            Nota

                        </button>


                        <button
                            class="btn btn-wa"
                            onclick="sendWhatsApp(${order.id})">

                            WhatsApp

                        </button>


                        <button
                            class="btn btn-danger"
                            onclick="deleteOrder(${order.id})">

                            Hapus

                        </button>

                    </div>

                </div>

            `;

        }).join("");

}


searchEl.addEventListener(
    "input",
    function () {

        renderHistory(
            this.value
        );

    }
);


// ==========================================
// NOTA
// ==========================================

function showReceipt(order) {

    const status =
        order.balance <= 0
        ? "LUNAS"
        : "BELUM LUNAS";


    const productRows =
        order.products.map(
            (product, index) => `

                <tr>

                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(product.name)}
                    </td>

                    <td>
                        ${product.quantity}
                    </td>

                    <td>
                        ${rupiah(product.price)}
                    </td>

                    <td>
                        ${rupiah(product.subtotal)}
                    </td>

                </tr>

            `
        ).join("");


    receipt.innerHTML = `

        <div class="receipt-header">

            <h1>
                🌸 SnD FlowerBox Ponorogo
            </h1>

            <p>
                Kasir & Penyewaan Papan Bunga
            </p>

        </div>


        <div class="receipt-line"></div>


        <div class="receipt-number">

            <strong>
                ${escapeHTML(order.orderNo)}
            </strong>

            <strong>
                ${status}
            </strong>

        </div>


        <div class="receipt-section">

            <div>

                <span>Pelanggan</span>

                <strong>
                    ${escapeHTML(order.customer)}
                </strong>

            </div>


            <div>

                <span>WhatsApp</span>

                <strong>
                    ${escapeHTML(order.phone)}
                </strong>

            </div>


            <div>

                <span>Tanggal Kirim</span>

                <strong>
                    ${formatDate(order.startDate)}
                </strong>

            </div>


            <div>

                <span>Tanggal Ambil</span>

                <strong>
                    ${formatDate(order.endDate)}
                </strong>

            </div>

        </div>


        <table class="receipt-products">

            <thead>

                <tr>

                    <th>No</th>

                    <th>Produk</th>

                    <th>Qty</th>

                    <th>Harga</th>

                    <th>Subtotal</th>

                </tr>

            </thead>


            <tbody>

                ${productRows}

            </tbody>

        </table>


        <div class="receipt-line"></div>


        <div class="receipt-row">

            <span>
                Subtotal Produk
            </span>

            <strong>
                ${rupiah(order.subtotal)}
            </strong>

        </div>


        <div class="receipt-row">

            <span>
                Pengiriman
            </span>

            <strong>
                ${rupiah(order.delivery)}
            </strong>

        </div>


        <div class="receipt-row total-row">

            <span>
                TOTAL
            </span>

            <strong>
                ${rupiah(order.total)}
            </strong>

        </div>


        <div class="receipt-row">

            <span>
                Pembayaran / DP
            </span>

            <strong>
                ${rupiah(order.dp)}
            </strong>

        </div>


        <div class="receipt-row balance-row">

            <span>
                SISA
            </span>

            <strong>
                ${rupiah(order.balance)}
            </strong>

        </div>


        ${
            order.notes
            ? `

                <div class="receipt-notes">

                    <strong>
                        Catatan:
                    </strong>

                    <p>
                        ${escapeHTML(order.notes)}
                    </p>

                </div>

            `
            : ""
        }


        <div class="receipt-footer">

            <p>
                Terima kasih telah menggunakan
            </p>

            <strong>
                SnD FlowerBox Ponorogo 🌸
            </strong>

        </div>

    `;


    modal.classList.remove("hidden");

}


// ==========================================
// VIEW ORDER
// ==========================================

function viewOrder(id) {

    const order =
        getOrders().find(
            item => item.id === id
        );


    if (!order) {

        alert(
            "Pesanan tidak ditemukan."
        );

        return;

    }


    showReceipt(order);

}


// ==========================================
// CLOSE MODAL
// ==========================================

document.getElementById(
    "closeModal"
).addEventListener(
    "click",
    () => modal.classList.add("hidden")
);


modal.addEventListener(
    "click",
    function(e) {

        if (e.target === modal) {

            modal.classList.add("hidden");

        }

    }
);


// ==========================================
// PREVIEW
// ==========================================

document.getElementById(
    "previewBtn"
).addEventListener(
    "click",
    function() {

        const calculation =
            calculateTotal();


        const previewOrder = {

            orderNo:
                orderNoEl.textContent,

            customer:
                customer.value || "-",

            phone:
                phone.value || "-",

            startDate:
                startDate.value,

            endDate:
                endDate.value,

            products:
                calculation.products,

            subtotal:
                calculation.subtotal,

            delivery:
                calculation.delivery,

            total:
                calculation.total,

            dp:
                calculation.dp,

            balance:
                calculation.balance,

            notes:
                notes.value || ""

        };


        if (
            previewOrder.products.length === 0
        ) {

            alert(
                "Tambahkan minimal satu produk."
            );

            return;

        }


        showReceipt(
            previewOrder
        );

    }
);


// ==========================================
// DOWNLOAD PNG
// ==========================================

document.getElementById(
    "downloadBtn"
).addEventListener(
    "click",
    async function() {

        if (
            typeof html2canvas ===
            "undefined"
        ) {

            alert(
                "html2canvas belum tersedia. Pastikan internet aktif."
            );

            return;

        }


        try {

            const canvas =
                await html2canvas(
                    receipt,
                    {
                        scale: 2,
                        backgroundColor:
                            "#ffffff"
                    }
                );


            const link =
                document.createElement(
                    "a"
                );


            link.download =
                `${orderNoEl.textContent}.png`;


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();

        } catch (error) {

            console.error(error);

            alert(
                "Gagal membuat gambar nota."
            );

        }

    }
);


// ==========================================
// WHATSAPP
// ==========================================

function normalizePhone(number) {

    number =
        String(number)
        .replace(/\D/g, "");


    if (
        number.startsWith("0")
    ) {

        number =
            "62" +
            number.substring(1);

    }


    if (
        !number.startsWith("62")
    ) {

        number =
            "62" + number;

    }


    return number;

}


function createWhatsAppMessage(order) {

    let productText = "";


    order.products.forEach(
        (product, index) => {

            productText +=
                `${index + 1}. ${product.name}\n` +
                `   ${product.quantity} x ${rupiah(product.price)} = ${rupiah(product.subtotal)}\n`;

        }
    );


    return `Halo Kak ${order.customer} 👋

Terima kasih sudah melakukan pemesanan di SnD FlowerBox Ponorogo 🌸

🧾 *DETAIL PESANAN*

No. Pesanan:
${order.orderNo}

🌸 *PRODUK*
${productText}

📅 Tanggal kirim:
${formatDate(order.startDate)}

📅 Tanggal ambil:
${formatDate(order.endDate)}

💰 Subtotal:
${rupiah(order.subtotal)}

🚚 Pengiriman:
${rupiah(order.delivery)}

💵 *TOTAL:
${rupiah(order.total)}*

💳 Pembayaran:
${rupiah(order.dp)}

📌 Sisa:
${rupiah(order.balance)}

Status:
${order.balance <= 0 ? "LUNAS" : "BELUM LUNAS"}

${order.notes ? `📝 Catatan:\n${order.notes}\n` : ""}

Terima kasih 🙏

*SnD FlowerBox Ponorogo* 🌸`;

}


function sendWhatsApp(id) {

    const order =
        getOrders().find(
            item => item.id === id
        );


    if (!order) {

        alert(
            "Pesanan tidak ditemukan."
        );

        return;

    }


    const number =
        normalizePhone(
            order.phone
        );


    const message =
        createWhatsAppMessage(
            order
        );


    const url =
        `https://wa.me/${number}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );

}


document.getElementById(
    "waBtn"
).addEventListener(
    "click",
    function() {

        const orderNo =
            receipt.querySelector(
                ".receipt-number strong"
            );


        if (!orderNo) return;


        const order =
            getOrders().find(
                item =>
                    item.orderNo ===
                    orderNo.textContent
            );


        if (order) {

            sendWhatsApp(
                order.id
            );

        }

    }
);


// ==========================================
// PRINT
// ==========================================

document.getElementById(
    "printBtn"
).addEventListener(
    "click",
    function() {

        const printWindow =
            window.open(
                "",
                "_blank"
            );


        printWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    Nota SnD FlowerBox
                </title>

                <style>

                    body {
                        font-family: Arial;
                        padding: 20px;
                    }

                    .receipt {
                        max-width: 600px;
                        margin: auto;
                    }

                    .receipt-header {
                        text-align: center;
                    }

                    .receipt-line {
                        border-top:
                            1px dashed #999;
                        margin: 15px 0;
                    }

                    .receipt-number {
                        display: flex;
                        justify-content:
                            space-between;
                    }

                    .receipt-section {
                        margin: 15px 0;
                    }

                    .receipt-section span {
                        display: block;
                        color: #777;
                        font-size: 12px;
                    }

                    .receipt-section strong {
                        display: block;
                    }

                    table {
                        width: 100%;
                        border-collapse:
                            collapse;
                    }

                    th,
                    td {
                        padding: 7px;
                        border-bottom:
                            1px solid #ddd;
                        text-align: left;
                    }

                    th:last-child,
                    td:last-child {
                        text-align: right;
                    }

                    .receipt-row {
                        display: flex;
                        justify-content:
                            space-between;
                        padding: 7px 0;
                    }

                    .total-row {
                        border-top:
                            1px solid #222;
                        font-size: 18px;
                    }

                    .balance-row {
                        font-size: 18px;
                        font-weight: bold;
                    }

                    .receipt-footer {
                        text-align: center;
                        margin-top: 30px;
                    }

                </style>

            </head>

            <body>

                <div class="receipt">

                    ${receipt.innerHTML}

                </div>

                <script>

                    window.onload =
                    function() {

                        window.print();

                    };

                <\/script>

            </body>

            </html>

        `);


        printWindow.document.close();

    }
);


// ==========================================
// HAPUS TRANSAKSI
// ==========================================

function deleteOrder(id) {

    const orders =
        getOrders();


    const order =
        orders.find(
            item => item.id === id
        );


    if (!order) return;


    const confirmDelete =
        confirm(
            `Hapus pesanan ${order.orderNo}?`
        );


    if (!confirmDelete) return;


    const newOrders =
        orders.filter(
            item => item.id !== id
        );


    saveOrders(
        newOrders
    );


    renderHistory(
        searchEl.value
    );


    updateStats();

    updateOrderNumber();

}


// ==========================================
// RESET SEMUA DATA
// ==========================================

document.getElementById(
    "clearAllBtn"
).addEventListener(
    "click",
    function() {

        const orders =
            getOrders();


        if (orders.length === 0) {

            alert(
                "Belum ada data transaksi."
            );

            return;

        }


        const confirmReset =
            confirm(
                "Semua transaksi akan dihapus. Lanjutkan?"
            );


        if (!confirmReset) return;


        localStorage.removeItem(
            STORAGE_KEY
        );


        renderHistory();

        updateStats();

        resetForm();

    }
);


// ==========================================
// STATISTIK
// ==========================================

function updateStats() {

    const orders =
        getOrders();


    const revenue =
        orders.reduce(
            (sum, order) =>
                sum +
                Number(order.dp || 0),
            0
        );


    const unpaid =
        orders.filter(
            order =>
                Number(order.balance) > 0
        ).length;


    const today =
        new Date()
        .toISOString()
        .split("T")[0];


    const rented =
        orders.filter(
            order =>
                order.startDate <= today &&
                order.endDate >= today
        ).length;


    statOrders.textContent =
        orders.length;


    statRevenue.textContent =
        rupiah(revenue);


    statUnpaid.textContent =
        unpaid;


    statRented.textContent =
        rented;

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        addProductRow();

        updateOrderNumber();

        calculateTotal();

        renderHistory();

        updateStats();

    }
);
