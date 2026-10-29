import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Wallet, Users,
  BarChart3, Settings, Plus, Search, Download, Upload, Menu, X, TrendingUp,
  Boxes, AlertTriangle, ArrowDownToLine, Receipt, CheckCircle2, Pencil, Trash2,
  CircleDollarSign, CalendarDays, ChevronRight, RotateCcw
} from 'lucide-react';
import seedProducts from './data/products.json';
import { parseMoney, calculateSale, formatUSD } from './lib/finance';
import { groupProductsByName } from './lib/inventory';
import { mapProductRows, productIdentity } from './lib/productImport.js';
import * as XLSX from 'xlsx';
import './styles.css';

const STORAGE_KEY = 'zapchast-pro-react-v1';
const navItems = [
  ['dashboard','Bosh sahifa',LayoutDashboard,'ASOSIY'],
  ['products','Mahsulotlar',Package,'ASOSIY'],
  ['sales','Sotuv',ShoppingCart,'ASOSIY'],
  ['stock','Ombor va kirim',Warehouse,'ASOSIY'],
  ['finance','Moliya',Wallet,'BOSHQARUV'],
  ['customers','Mijozlar va qarzlar',Users,'BOSHQARUV'],
  ['reports','Hisobotlar',BarChart3,'BOSHQARUV'],
  ['settings','Sozlamalar',Settings,'BOSHQARUV']
];
const initialState = () => ({ products: seedProducts.map(p=>({...p})), sales: [], expenses: [], customers: [], orders: [], cash: 0, stockMoves: [] });
function readState(){ try { const s=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(s && Array.isArray(s.products)) return s; } catch{} return initialState(); }
function App(){
  const [state,setState]=useState(readState);
  const [page,setPage]=useState('dashboard');
  const [query,setQuery]=useState('');
  const [category,setCategory]=useState('all');
  const [selectedStockGroup,setSelectedStockGroup]=useState(null);
  const [stockDetailQuery,setStockDetailQuery]=useState('');
  const [selectedProductIds,setSelectedProductIds]=useState([]);
  const [modal,setModal]=useState(null);
  const [mobileNav,setMobileNav]=useState(false);
  const [notice,setNotice]=useState('');
  const [cart,setCart]=useState([]);
  const [receipt,setReceipt]=useState(null);
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));},[state]);
  const title=navItems.find(n=>n[0]===page)?.[1]||'Bosh sahifa';
  const update=(fn)=>setState(prev=>fn(structuredClone(prev)));
  const fmt=(v)=>formatUSD(v);
  const totalSales=state.sales.reduce((s,x)=>s+(+x.total||0),0);
  const received=state.sales.reduce((s,x)=>s+(+x.paid||0),0);
  const costSales=state.sales.reduce((s,x)=>s+(+x.costTotal||0),0);
  const expenses=state.expenses.reduce((s,x)=>s+(+x.amount||0),0);
  const inventoryValue=state.products.reduce((s,p)=>s+(+p.qty||0)*(+p.cost||0),0);
  const debt=state.customers.reduce((s,c)=>s+(+c.debt||0),0);
  const lowStock=state.products.filter(p=>+p.limit>0 && +p.qty<=+p.limit);
  const go=(p)=>{setPage(p);setQuery('');setCategory('all');setSelectedStockGroup(null);setStockDetailQuery('');setMobileNav(false);setModal(null)};
  const notify=(text)=>{setNotice(text);setTimeout(()=>setNotice(''),3500)};
  const filtered=useMemo(()=>state.products.filter(p=>(`${p.name} ${p.size} ${p.category}`).toLowerCase().includes(query.toLowerCase())&&(category==='all'||p.category===category)),[state.products,query,category]);
  const categories=[...new Set(state.products.map(p=>p.category))].sort();
  const stockGroups=useMemo(()=>groupProductsByName(state.products).filter(g=>g.name.toLowerCase().includes(query.toLowerCase())&&(category==='all'||g.products.some(p=>p.category===category))),[state.products,query,category]);
  const selectedStock=selectedStockGroup ? stockGroups.find(g=>g.key===selectedStockGroup) || groupProductsByName(state.products).find(g=>g.key===selectedStockGroup) : null;
  const stockDetailProducts=(selectedStock?.products||[]).filter(p=>`${p.name} ${p.size||''} ${p.category||''}`.toLowerCase().includes(stockDetailQuery.toLowerCase()));
  const addProduct=(form)=>{
    const product={id:`new-${Date.now()}`,category:form.category||'Boshqa',name:form.name.trim(),size:form.size.trim(),qty:parseMoney(form.qty),limit:parseMoney(form.limit),cost:parseMoney(form.cost),wholesale:parseMoney(form.wholesale),retail:parseMoney(form.retail)};
    if(!product.name) return notify('Mahsulot nomini kiriting.');
    if([product.qty,product.limit,product.cost,product.wholesale,product.retail].some(n=>!Number.isFinite(n)||n<0)) return notify('Sonli qiymatlarni tekshiring. Masalan: 1,32 yoki 1.32');
    update(s=>({...s,products:[product,...s.products]}));setModal(null);notify('Mahsulot qo‘shildi.');
  };
  const saveProduct=(id,form)=>{
    update(s=>({...s,products:s.products.map(p=>p.id===id?{...p,...form,qty:Math.max(0,parseMoney(form.qty)),limit:Math.max(0,parseMoney(form.limit)),cost:Math.max(0,parseMoney(form.cost)),wholesale:Math.max(0,parseMoney(form.wholesale)),retail:Math.max(0,parseMoney(form.retail))}:p)}));
    setModal(null);notify('Mahsulot ma’lumotlari saqlandi.');
  };
  const deleteProduct=(product)=>{
    if(!confirm(`“${product.name}${product.size ? ` — ${product.size}` : ''}” mahsulotini ombordan o‘chirmoqchimisiz? Sotuvlar tarixi saqlanib qoladi.`)) return;
    update(s=>({...s,products:s.products.filter(p=>p.id!==product.id),stockMoves:(s.stockMoves||[]).filter(m=>m.productId!==product.id)}));
    setCart(c=>c.filter(item=>item.id!==product.id));
    if(selectedStockGroup) setSelectedStockGroup(null);
    setSelectedProductIds(ids=>ids.filter(id=>id!==product.id));
    notify('Mahsulot ombordan o‘chirildi. Sotuvlar tarixi saqlab qolindi.');
  };
  const toggleProductSelection=(id)=>setSelectedProductIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
  const visibleProductIds=filtered.slice(0,250).map(p=>p.id);
  const allVisibleSelected=visibleProductIds.length>0&&visibleProductIds.every(id=>selectedProductIds.includes(id));
  const toggleVisibleProducts=()=>setSelectedProductIds(ids=>allVisibleSelected?ids.filter(id=>!visibleProductIds.includes(id)):[...new Set([...ids,...visibleProductIds])]);
  const deleteSelectedProducts=()=>{
    const ids=new Set(selectedProductIds);
    if(!ids.size)return notify('Avval o‘chiriladigan mahsulotlarni belgilang.');
    if(!confirm(`Belgilangan ${ids.size} ta mahsulotni o‘chirmoqchimisiz? Sotuvlar tarixi saqlanib qoladi.`))return;
    update(s=>({...s,products:s.products.filter(p=>!ids.has(p.id)),stockMoves:(s.stockMoves||[]).filter(m=>!ids.has(m.productId))}));
    setCart(c=>c.filter(item=>!ids.has(item.id)));
    setSelectedProductIds([]);setSelectedStockGroup(null);
    notify(`${ids.size} ta mahsulot o‘chirildi. Sotuvlar tarixi saqlab qolindi.`);
  };
  const importExcel=async(file)=>{
    if(!file) return;
    try {
      const buffer=await file.arrayBuffer();
      const workbook=XLSX.read(buffer,{type:'array',cellDates:false});
      const imported=[];
      for(const sheetName of workbook.SheetNames){
        const rows=XLSX.utils.sheet_to_json(workbook.Sheets[sheetName],{header:1,defval:'',raw:true,blankrows:false});
        imported.push(...mapProductRows(rows,sheetName));
      }
      if(!imported.length){notify('Excel faylida mahsulotlar topilmadi. Birinchi qatorda ustun nomlari bo‘lsin.');return;}
      const currentByIdentity=new Map(state.products.map(p=>[productIdentity(p),p]));
      let added=0,updated=0;
      const next=[...state.products];
      for(const item of imported){
        const key=productIdentity(item);
        const existing=currentByIdentity.get(key);
        if(existing){
          const index=next.findIndex(p=>p.id===existing.id);
          if(index>=0) next[index]={...existing,...item,id:existing.id};
          currentByIdentity.set(key,next[index]);
          updated++;
        } else { next.unshift(item);currentByIdentity.set(key,item);added++; }
      }
      update(s=>({...s,products:next}));
      setQuery('');setCategory('all');
      notify(`Excel import yakunlandi: ${added} ta yangi, ${updated} ta yangilangan mahsulot.`);
    } catch(error) { console.error('Excel import error:',error);notify('Excel faylini o‘qib bo‘lmadi. .xlsx yoki .xls faylini tanlang.'); }
  };
  const addToCart=(p)=>{if(!p.retail&&!p.wholesale)return notify('Avval mahsulot narxini kiriting.');setCart(prev=>{const found=prev.find(x=>x.id===p.id);return found?prev.map(x=>x.id===p.id?{...x,qty:x.qty+1}:x):[...prev,{id:p.id,qty:1,price:+(p.retail||p.wholesale),priceType:p.retail?'Dona':'Optom'}]})};
  const changeCart=(id,key,value)=>setCart(prev=>prev.map(x=>x.id===id?{...x,[key]:value}:x));
  const checkout=(customerName,payment)=>{
    if(!cart.length)return notify('Savatcha bo‘sh.');
    const items=cart.map(x=>{const p=state.products.find(p=>p.id===x.id);return {...x,name:p.name,size:p.size,cost:+p.cost||0,category:p.category}});
    for(const item of items){const p=state.products.find(p=>p.id===item.id);if(!Number.isFinite(+item.qty)||+item.qty<1||+item.qty>p.qty)return notify(`${p.name}: omborda yetarli qoldiq yo‘q.`);if(!Number.isFinite(+item.price)||+item.price<=0)return notify('Sotuv narxini tekshiring.');}
    const sums=calculateSale(items);const paid=payment==='Qarz'?0:sums.total;
    const sale={id:Date.now(),date:new Date().toISOString(),customer:customerName.trim(),payment,...sums,paid,items};
    update(s=>{const customers=[...s.customers];let customer=customers.find(c=>c.name.toLowerCase()===customerName.trim().toLowerCase()&&customerName.trim());
      if(customer){customer.debt=(+customer.debt||0)+sums.total-paid;customer.paid=(+customer.paid||0)+paid;}
      else if(customerName.trim())customers.push({id:Date.now(),name:customerName.trim(),phone:'',paid,debt:sums.total-paid});
      return {...s,products:s.products.map(p=>{const sold=items.find(i=>i.id===p.id);return sold?{...p,qty:p.qty-sold.qty}:p}),sales:[...s.sales,sale],customers,cash:(+s.cash||0)+paid};});
    setCart([]);setReceipt(sale);notify(`Sotuv saqlandi: ${fmt(sums.total)}`);
  };
  const stockIn=(id,qty,cost,note)=>{qty=parseMoney(qty);if(!Number.isFinite(qty)||qty<=0)return notify('Kirim miqdorini to‘g‘ri kiriting.');update(s=>({...s,products:s.products.map(p=>p.id===id?{...p,qty:p.qty+qty,cost:cost===''?p.cost:parseMoney(cost)}:p),stockMoves:[...(s.stockMoves||[]),{id:Date.now(),date:new Date().toISOString(),productId:id,qty,cost:cost===''?null:parseMoney(cost),note:note||'Kirim'}]}));setModal(null);notify('Ombor kirimi saqlandi.');};
  const addExpense=(type,amount,note)=>{amount=parseMoney(amount);if(!Number.isFinite(amount)||amount<=0)return notify('Xarajat summasini to‘g‘ri kiriting.');update(s=>({...s,expenses:[...s.expenses,{id:Date.now(),date:new Date().toISOString(),type,amount,note}],cash:(+s.cash||0)-amount}));setModal(null);notify('Xarajat saqlandi.');};
  const addCustomer=(name,phone)=>{if(!name.trim())return notify('Mijoz ismini kiriting.');update(s=>({...s,customers:[...s.customers,{id:Date.now(),name:name.trim(),phone,paid:0,debt:0}]}));setModal(null);notify('Mijoz qo‘shildi.');};
  const payDebt=(id,amount)=>{amount=parseMoney(amount);const c=state.customers.find(c=>c.id===id);if(!c||!Number.isFinite(amount)||amount<=0||amount>c.debt)return notify('To‘lov summasini tekshiring.');update(s=>({...s,customers:s.customers.map(c=>c.id===id?{...c,debt:c.debt-amount,paid:(+c.paid||0)+amount}:c),cash:(+s.cash||0)+amount}));setModal(null);notify('Qarz to‘lovi saqlandi.');};
  const download=(data,name,type)=>{const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);};
  const exportProducts=()=>{const headers=['category','name','size','qty','limit','cost','wholesale','retail'];const csv=[headers.join(';'),...state.products.map(p=>headers.map(k=>String(p[k]??'').replaceAll(';',',')).join(';'))].join('\r\n');download('\ufeff'+csv,'zapchast-mahsulotlar.csv','text/csv;charset=utf-8');};
  const backup=()=>download(JSON.stringify(state,null,2),`zapchast-zaxira-${new Date().toISOString().slice(0,10)}.json`,'application/json');
  const restore=(file)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const s=JSON.parse(reader.result);if(!Array.isArray(s.products)||!Array.isArray(s.sales))throw Error();setState(s);notify('Zaxira tiklandi.');}catch{notify('JSON zaxira fayli noto‘g‘ri.');}};reader.readAsText(file);};
  const header=(heading,sub,action=null)=><div className="page-heading"><div><h1>{heading}</h1><p>{sub}</p></div>{action}</div>;
  const stat=(label,value,Icon,foot)=><div className="stat-card"><div className="stat-label">{label}<span className="stat-icon"><Icon size={18}/></span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div></div>;
  const productTable=(items)=> <div className="table-wrap"><table><thead><tr><th><input aria-label="Ko‘rinib turgan mahsulotlarning barchasini belgilash" type="checkbox" checked={items.length>0&&items.every(p=>selectedProductIds.includes(p.id))} onChange={()=>{const ids=items.map(p=>p.id);setSelectedProductIds(prev=>items.length&&items.every(p=>prev.includes(p.id))?prev.filter(id=>!ids.includes(id)):[...new Set([...prev,...ids])]);}} /></th><th>Mahsulot</th><th>Kategoriya</th><th>O‘lcham / model</th><th>Qoldiq</th><th>Tannarx</th><th>Optom narx</th><th>Dona narx</th><th>Amallar</th></tr></thead><tbody>{items.map(p=><tr key={p.id}><td><input aria-label={`${p.name} mahsulotini belgilash`} type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={()=>toggleProductSelection(p.id)}/></td><td><strong>{p.name}</strong></td><td><span className="tag">{p.category}</span></td><td>{p.size||'—'}</td><td><b className={p.limit>0&&p.qty<=p.limit?'red':''}>{p.qty}</b></td><td>{p.cost?fmt(p.cost):'—'}</td><td>{p.wholesale?fmt(p.wholesale):'—'}</td><td>{p.retail?fmt(p.retail):'—'}</td><td><div className="table-actions"><button className="icon-button" title="Tahrirlash" onClick={()=>setModal({type:'editProduct',product:p})}><Pencil size={15}/></button><button className="icon-button delete-icon" title="Mahsulotni o‘chirish" onClick={()=>deleteProduct(p)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>;
  const salesTable=(items)=>items.length?<div className="table-wrap"><table><thead><tr><th>Sana</th><th>Mijoz</th><th>To‘lov</th><th>Jami</th><th>Tannarx</th><th>Yalpi foyda</th><th>Chek</th></tr></thead><tbody>{items.map(s=><tr key={s.id}><td>{new Date(s.date).toLocaleString('uz-UZ')}</td><td>{s.customer||'Oddiy mijoz'}</td><td><span className="tag">{s.payment}</span></td><td>{fmt(s.total)}</td><td>{fmt(s.costTotal)}</td><td className={s.grossProfit>=0?'green-text':'red'}>{fmt(s.grossProfit)}</td><td><button className="btn light small" onClick={()=>setReceipt(s)}><Receipt size={14}/> Chek</button></td></tr>)}</tbody></table></div>:<Empty text="Hozircha sotuv qayd etilmagan."/>;
  const productFilters=<div className="filters"><div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Mahsulot nomi yoki o‘lchamini qidiring…"/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Barcha kategoriyalar</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>;
  let content=null;
  if(page==='dashboard') content=<>
    {header('Assalomu alaykum! 👋','Do‘koningizning bugungi holati va asosiy ko‘rsatkichlari.',<button className="btn" onClick={()=>go('sales')}><Plus size={17}/> Yangi sotuv</button>)}
    <div className="stats-grid">{stat('Jami mahsulotlar',state.products.length,Package,'Excel faylidan import qilingan qatorlar')}{stat('Sotuvlar summasi',fmt(totalSales),TrendingUp,`${state.sales.length} ta sotuv qayd etilgan`)}{stat('Yalpi foyda',fmt(totalSales-costSales),CircleDollarSign,'Sotilgan mahsulot tannarxi chegirilgan')}{stat('Ombor tannarxi',fmt(inventoryValue),Boxes,'Import qilingan narxlar asosida')}</div>
    <div className="two-col"><section className="panel"><div className="panel-title"><h2>Tezkor amallar</h2><span className="tag">Ish jarayoni</span></div><div className="quick-grid"><button onClick={()=>go('sales')}><ShoppingCart/><b>Sotuv qilish</b><small>Mahsulotni tanlab sotish</small></button><button onClick={()=>setModal({type:'stockIn'})}><ArrowDownToLine/><b>Kirim kiritish</b><small>Omborga mahsulot qo‘shish</small></button><button onClick={()=>go('products')}><Search/><b>Mahsulot topish</b><small>Nom yoki o‘lcham bo‘yicha</small></button><button onClick={()=>go('finance')}><Wallet/><b>Moliya</b><small>Tushum va xarajatlar</small></button></div></section><section className="panel"><div className="panel-title"><h2>Ombor ogohlantirishlari</h2><span className="tag">{lowStock.length} ta</span></div>{lowStock.slice(0,6).map(p=><div className="list-row" key={p.id}><span>{p.name} {p.size}</span><b className="red">{p.qty} dona</b></div>)}{!lowStock.length&&<Empty text="Minimal zaxira chegarasidan past mahsulotlar yo‘q."/>}</section></div>
    <section className="panel"><div className="panel-title"><h2>Oxirgi sotuvlar</h2><button className="btn light" onClick={()=>go('sales')}>Barchasi <ChevronRight size={16}/></button></div>{salesTable([...state.sales].reverse().slice(0,6))}</section>
    <div className="notice"><AlertTriangle size={18}/> Excel ichidagi ayrim narxlar formulaga yoki valyuta kursiga bog‘liq. Import qilingan qiymatlarni tekshirib chiqing; hozirgi versiya faqat shu brauzerda saqlanadi.</div>
  </>;
  else if(page==='products') content=<>{header('Mahsulotlar','Mahsulotlarni o‘chiring, Excel ro‘yxatini yuklang yoki yangi mahsulot qo‘shing.',<div className="button-row product-heading-actions"><label className="btn light file-btn"><Upload size={16}/> Excel yuklash<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>{importExcel(e.target.files?.[0]);e.target.value='';}}/></label><button className="btn" onClick={()=>setModal({type:'addProduct'})}><Plus size={17}/> Mahsulot qo‘shish</button></div>)}<section className="panel">{productFilters}<div className="bulk-toolbar"><div className="table-meta">Ko‘rsatilmoqda: {Math.min(filtered.length,250)} / {filtered.length} mahsulot · Excel yuklanganda mos mahsulot yangilanadi, yangisi qo‘shiladi</div><div className="button-row"><button className="btn light small" onClick={toggleVisibleProducts}>{allVisibleSelected?'Belgilashni bekor qilish':'Ko‘rinayotganlarni belgilash'}</button><button className="btn danger small" disabled={!selectedProductIds.length} onClick={deleteSelectedProducts}><Trash2 size={15}/> Belgilanganlarni o‘chirish ({selectedProductIds.length})</button></div></div>{productTable(filtered.slice(0,250))}<div className="panel-actions"><button className="btn light" onClick={exportProducts}><Download size={16}/> CSV eksport</button></div><p className="muted import-hint">Excel ustunlari: Mahsulot nomi, Kategoriya, O‘lcham/Model, Qoldiq, Minimal qoldiq, Tannarx, Optom narx, Dona narx. Ustun nomlari o‘zbekcha, inglizcha yoki ruscha bo‘lishi mumkin.</p></section></>;
  else if(page==='sales') content=<>{header('Sotuv','Mahsulotni qidiring, savatchaga qo‘shing va sotuvni rasmiylashtiring.')}<div className="sales-layout"><section className="panel"><div className="panel-title"><h2>Mahsulot tanlash</h2><span className="tag">{state.products.length} ta</span></div><div className="searchbox full"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nom yoki o‘lcham bo‘yicha qidirish…"/></div><div className="pick-list">{filtered.slice(0,100).map(p=><button className="pick-item" key={p.id} onClick={()=>addToCart(p)}><span><strong>{p.name}</strong><small>{p.category} · {p.size||'O‘lcham yo‘q'} · qoldiq {p.qty}</small></span><b>{p.retail?fmt(p.retail):p.wholesale?fmt(p.wholesale):'Narx belgilanmagan'} <Plus size={15}/></b></button>)}</div></section><section className="panel cart-panel"><div className="panel-title"><h2>Savatcha</h2><span className="tag">{cart.reduce((a,x)=>a+x.qty,0)} dona</span></div>{cart.length?cart.map(x=>{const p=state.products.find(p=>p.id===x.id);return <div className="cart-line" key={x.id}><div className="cart-title"><b>{p?.name} {p?.size}</b><button className="icon-button" onClick={()=>setCart(c=>c.filter(z=>z.id!==x.id))}><Trash2 size={15}/></button></div><div className="cart-controls"><label>Miqdor<input type="number" min="1" max={p?.qty} value={x.qty} onChange={e=>changeCart(x.id,'qty',Math.max(1,parseInt(e.target.value)||1))}/></label><label>Narx ($)<input value={String(x.price)} onChange={e=>changeCart(x.id,'price',parseMoney(e.target.value))}/></label><b>{fmt(x.qty*x.price)}</b></div><small>Omborda: {p?.qty} · Tannarx: {fmt(p?.cost)}</small></div>}) : <Empty text="Sotish uchun mahsulot tanlang."/>}<div className="field"><label>Mijoz (ixtiyoriy)</label><input id="sale-customer" placeholder="Mijoz ismi yoki telefon"/></div><div className="field"><label>To‘lov turi</label><select id="sale-payment"><option>Naqd</option><option>Karta</option><option>Qarz</option><option>Aralash</option></select></div><div className="cart-total"><span>Jami</span><b>{fmt(cart.reduce((s,x)=>s+x.qty*x.price,0))}</b></div><button className="btn success full-btn" onClick={()=>checkout(document.getElementById('sale-customer')?.value||'',document.getElementById('sale-payment')?.value||'Naqd')}>Sotuvni tasdiqlash</button></section></div><section className="panel"><div className="panel-title"><h2>Sotuvlar tarixi</h2><span className="tag">{state.sales.length} ta</span></div>{salesTable([...state.sales].reverse())}</section></>;
  else if(page==='stock') content=<>{header('Ombor va kirim',selectedStock ? `“${selectedStock.name}” mahsulotining barcha turlari va qoldiqlari.` : 'Bir xil nomli mahsulotlar bitta qatorda ko‘rsatiladi. Mahsulot ustiga bossangiz, barcha turlari ochiladi.',<button className="btn" onClick={()=>setModal({type:'stockIn'})}><Plus size={17}/> Kirim kiritish</button>)}<div className="stats-grid">{stat('Mahsulot nomlari',stockGroups.length,Package,'Bir xil nomlar birlashtirilgan')}{stat('Jami birliklar',state.products.reduce((s,p)=>s+(+p.qty||0),0),Boxes,'Ombordagi umumiy miqdor')}{stat('Kam qolgan',lowStock.length,AlertTriangle,'Minimal limitdan past')}{stat('Ombor qiymati',fmt(inventoryValue),CircleDollarSign,'Tannarx asosida')}</div>{selectedStock ? <section className="panel"><div className="stock-detail-top"><button className="btn light" onClick={()=>{setSelectedStockGroup(null);setStockDetailQuery('');}}><ChevronRight size={16} className="back-chevron"/> Orqaga</button><div><h2>{selectedStock.name}</h2><p>{selectedStock.products.length} ta tur · jami {selectedStock.totalQty} dona</p></div></div><div className="searchbox full stock-detail-search"><Search size={17}/><input value={stockDetailQuery} onChange={e=>setStockDetailQuery(e.target.value)} placeholder="Ushbu mahsulot turlaridan qidirish: o‘lcham, model yoki kategoriya…"/><button className="icon-button" title="Qidiruvni tozalash" onClick={()=>setStockDetailQuery('')}><X size={15}/></button></div><div className="table-meta">Topildi: {stockDetailProducts.length} / {selectedStock.products.length} tur</div>{stockDetailProducts.length ? productTable(stockDetailProducts) : <Empty text="Qidiruvga mos tur topilmadi."/>}</section> : <section className="panel"><div className="panel-title"><h2>Ombordagi mahsulotlar</h2><span className="tag">{stockGroups.length} ta nom</span></div>{productFilters}<div className="stock-group-grid">{stockGroups.slice(0,300).map(group=><button className="stock-group-card" key={group.key} onClick={()=>{setSelectedStockGroup(group.key);setStockDetailQuery('');}}><span className="stock-group-icon"><Package size={21}/></span><span className="stock-group-info"><strong>{group.name}</strong><small>{[...new Set(group.products.map(p=>p.category).filter(Boolean))].slice(0,2).join(' · ')||'Kategoriya ko‘rsatilmagan'}</small><small>{group.products.length} ta tur / model</small></span><span className="stock-group-qty"><b>{group.totalQty}</b><small>dona</small></span><ChevronRight size={18} className="stock-group-chevron"/></button>)}</div>{stockGroups.length>300&&<div className="table-meta">Birinchi 300 ta nom ko‘rsatildi. Qidiruv orqali qolgan mahsulotlarni toping.</div>}{!stockGroups.length&&<Empty text="Qidiruvga mos mahsulot topilmadi."/>}</section>}<section className="panel"><div className="panel-title"><h2>Harakatlar tarixi</h2></div>{state.stockMoves?.length?<div className="table-wrap"><table><thead><tr><th>Sana</th><th>Mahsulot</th><th>Harakat</th><th>Miqdor</th><th>Tannarx</th><th>Izoh</th></tr></thead><tbody>{[...state.stockMoves].reverse().map(m=><tr key={m.id}><td>{new Date(m.date).toLocaleString('uz-UZ')}</td><td>{state.products.find(p=>p.id===m.productId)?.name||'Mahsulot'}</td><td><span className="tag">Kirim</span></td><td className="green-text">+{m.qty}</td><td>{m.cost===null?'—':fmt(m.cost)}</td><td>{m.note}</td></tr>)}</tbody></table></div>:<Empty text="Hozircha ombor harakati yo‘q."/>}</section></>;
  else if(page==='finance') content=<>{header('Moliya','Tushum, xarajat, yalpi foyda va qarzdorlik.',<button className="btn" onClick={()=>setModal({type:'expense'})}><Plus size={17}/> Xarajat kiritish</button>)}<div className="stats-grid">{stat('Sotuv summasi',fmt(totalSales),TrendingUp,'Jami rasmiylashtirilgan sotuv')}{stat('Qabul qilingan to‘lov',fmt(received),Wallet,'Sotuvlardan tushgan to‘lov')}{stat('Yalpi foyda',fmt(totalSales-costSales),CircleDollarSign,'Sotuv minus tannarx')}{stat('Xarajatlardan keyin',fmt(totalSales-costSales-expenses),Receipt,'Yalpi foyda minus kiritilgan xarajat')}</div><div className="notice"><AlertTriangle size={18}/> Bu hisoblar prototipda kiritilgan sotuv va xarajatlar bo‘yicha. Boshlang‘ich Excel narxlari to‘liq tekshirilmaguncha ularni rasmiy moliyaviy hisobot deb qabul qilmang.</div><div className="two-col"><section className="panel"><div className="panel-title"><h2>Xarajatlar</h2></div>{state.expenses.length?<div className="table-wrap"><table><thead><tr><th>Sana</th><th>Tur</th><th>Izoh</th><th>Summa</th></tr></thead><tbody>{[...state.expenses].reverse().map(x=><tr key={x.id}><td>{new Date(x.date).toLocaleDateString('uz-UZ')}</td><td>{x.type}</td><td>{x.note}</td><td>{fmt(x.amount)}</td></tr>)}</tbody></table></div>:<Empty text="Hozircha xarajat yo‘q."/>}</section><section className="panel"><div className="panel-title"><h2>Moliyaviy holat</h2></div><div className="list-row"><span>Kassadagi hisobiy qoldiq</span><b>{fmt(state.cash)}</b></div><div className="list-row"><span>Mijozlar qarzi</span><b className="red">{fmt(debt)}</b></div><div className="list-row"><span>Jami xarajatlar</span><b>{fmt(expenses)}</b></div><div className="list-row"><span>Sotilgan mahsulot tannarxi</span><b>{fmt(costSales)}</b></div></section></div></>;
  else if(page==='customers') content=<>{header('Mijozlar va qarzlar','Mijozlar ro‘yxati, to‘lovlar va qarzdorlik.',<button className="btn" onClick={()=>setModal({type:'customer'})}><Plus size={17}/> Mijoz qo‘shish</button>)}<section className="panel"><div className="panel-title"><h2>Mijozlar ro‘yxati</h2><span className="tag">{state.customers.length} ta</span></div>{state.customers.length?<div className="table-wrap"><table><thead><tr><th>Mijoz</th><th>Telefon</th><th>Jami to‘lovlar</th><th>Qolgan qarz</th><th>Amal</th></tr></thead><tbody>{state.customers.map(c=><tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.phone||'—'}</td><td>{fmt(c.paid||0)}</td><td className={c.debt>0?'red':'green-text'}>{fmt(c.debt||0)}</td><td>{c.debt>0&&<button className="btn light small" onClick={()=>setModal({type:'payDebt',customer:c})}>Qarz to‘lash</button>}</td></tr>)}</tbody></table></div>:<Empty text="Mijozlar hali kiritilmagan. Qarzga sotuv qilganda mijoz shu yerga qo‘shilishi mumkin."/>}</section></>;
  else if(page==='reports') content=<>{header('Hisobotlar','Sotuvlar, xarajatlar va ombor bo‘yicha umumiy ko‘rsatkichlar.',<button className="btn" onClick={backup}><Download size={16}/> JSON zaxira</button>)}<div className="stats-grid">{stat('Sotuvlar soni',state.sales.length,ShoppingCart,'Jami sotuv yozuvlari')}{stat('Jami sotuv',fmt(totalSales),TrendingUp,'Barcha qayd etilgan sotuvlar')}{stat('Jami xarajat',fmt(expenses),Receipt,'Kiritilgan xarajatlar')}{stat('Mijozlar qarzi',fmt(debt),Users,'To‘lanmagan qarzlar')}</div><section className="panel"><div className="panel-title"><h2>Eksport va zaxira</h2></div><p className="muted">Ma’lumotlarni zaxira fayliga saqlang. JSON fayli mahsulotlar, sotuvlar, xarajatlar, mijozlar va ombor harakatlarini saqlaydi.</p><div className="button-row"><button className="btn" onClick={backup}><Download size={16}/> Zaxira nusxa yuklab olish</button><button className="btn light" onClick={exportProducts}><Download size={16}/> Mahsulotlarni CSV qilish</button><label className="btn light file-btn"><Upload size={16}/> Zaxirani tiklash<input type="file" accept=".json" onChange={e=>restore(e.target.files?.[0])}/></label></div></section></>;
  else content=<>{header('Sozlamalar','Ma’lumotlar va do‘kon sozlamalarini boshqarish.')}<section className="panel"><div className="panel-title"><h2>Ma’lumotlar</h2></div><div className="notice"><AlertTriangle size={18}/> Hozircha ma’lumotlar shu brauzerda saqlanadi. Bir nechta qurilmada sinxron ishlash uchun backend va ma’lumotlar bazasi ulanishi kerak.</div><div className="button-row"><button className="btn light" onClick={backup}><Download size={16}/> Zaxira olish</button><label className="btn light file-btn"><Upload size={16}/> Zaxiradan tiklash<input type="file" accept=".json" onChange={e=>restore(e.target.files?.[0])}/></label><button className="btn danger" onClick={()=>{if(confirm('Barcha mahalliy o‘zgarishlar o‘chirilib, Excel import holati tiklansinmi?')){setState(initialState());setCart([]);notify('Boshlang‘ich holat tiklandi.');}}}><RotateCcw size={16}/> Boshlang‘ich holatga qaytarish</button></div></section><section className="panel"><div className="panel-title"><h2>Excel importi</h2></div><p className="muted">Excel faylidan {seedProducts.length.toLocaleString('uz-UZ')} ta mahsulot qatori va {categories.length} ta varaq nomi kategoriya sifatida kiritilgan. Ba’zi narx ustunlari turli valyuta/formulalarda bo‘lishi mumkin, ularni tasdiqlash zarur.</p></section></>;
  return <div className="app-shell"><aside className={`sidebar ${mobileNav?'open':''}`}><div className="brand"><div className="brand-mark">Z</div><div>Zapchast<span>Pro</span><small>DO‘KON BOSHQARUVI</small></div><button className="mobile-close" onClick={()=>setMobileNav(false)}><X/></button></div>{['ASOSIY','BOSHQARUV'].map(group=><div key={group}><div className="nav-label">{group}</div>{navItems.filter(n=>n[3]===group).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span></button>)}</div>)}<div className="sidebar-footer"><div className="status-dot"/> Lokal prototip <small>Ma’lumotlar shu qurilmada</small></div></aside>{mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}<main className="main-area"><header className="topbar"><div className="topbar-left"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div><strong>{title}</strong><small>Zapchast do‘koni / {title}</small></div></div><div className="topbar-right"><span className="status-pill"><span/> Prototip rejimi</span><div className="user-avatar">Z</div></div></header><div className="content-area">{content}<footer>Zapchast Pro · React + Vite · Boshlang‘ich versiya</footer></div></main>{notice&&<div className="toast"><CheckCircle2 size={18}/>{notice}</div>}{modal&&<Modal modal={modal} close={()=>setModal(null)} addProduct={addProduct} saveProduct={saveProduct} stockIn={stockIn} addExpense={addExpense} addCustomer={addCustomer} payDebt={payDebt} products={state.products} />}{receipt&&<ReceiptModal sale={receipt} close={()=>setReceipt(null)} fmt={fmt}/>}</div>
}
function Empty({text}){return <div className="empty-state"><div className="empty-icon"><Boxes size={23}/></div>{text}</div>}
function Modal({modal,close,addProduct,saveProduct,stockIn,addExpense,addCustomer,payDebt,products}){
 const [form,setForm]=useState(()=>modal.product?{...modal.product}: {name:'',category:'Boshqa',size:'',qty:'0',limit:'0',cost:'0',wholesale:'0',retail:'0'});
 const set=(k,v)=>setForm(f=>({...f,[k]:v}));
 const fields=[['name','Mahsulot nomi','text'],['category','Kategoriya','text'],['size','O‘lcham / model','text'],['qty','Miqdor','number'],['limit','Minimal qoldiq','number'],['cost','Tannarx ($)','text'],['wholesale','Optom narx ($)','text'],['retail','Dona narx ($)','text']];
 const title={addProduct:'Yangi mahsulot',editProduct:'Mahsulotni tahrirlash',stockIn:'Omborga kirim',expense:'Xarajat kiritish',customer:'Mijoz qo‘shish',payDebt:'Qarz to‘lovi'}[modal.type]||'Ma’lumot';
 const submit=(e)=>{e.preventDefault();if(modal.type==='addProduct')addProduct(form);if(modal.type==='editProduct')saveProduct(modal.product.id,form);if(modal.type==='stockIn')stockIn(form.productId||products[0]?.id,form.qty,form.cost,form.note);if(modal.type==='expense')addExpense(form.type,form.amount,form.note);if(modal.type==='customer')addCustomer(form.name,form.phone);if(modal.type==='payDebt')payDebt(modal.customer.id,form.amount);};
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}><form className="modal-card" onSubmit={submit}><div className="modal-header"><div><h2>{title}</h2><p>Kerakli ma’lumotlarni kiriting.</p></div><button type="button" className="icon-button" onClick={close}><X/></button></div>
 {['addProduct','editProduct'].includes(modal.type)&&<div className="form-grid">{fields.map(([k,label,type])=><label className={k==='name'?'span-two':''} key={k}>{label}<input required={k==='name'} type={type} step={type==='number'?'any':undefined} value={form[k]??''} onChange={e=>set(k,e.target.value)} placeholder={['cost','wholesale','retail'].includes(k)?'Masalan: 1,32':''}/></label>)}</div>}
 {modal.type==='stockIn'&&<div className="form-grid"><label className="span-two">Mahsulot<select required value={form.productId||products[0]?.id||''} onChange={e=>set('productId',e.target.value)}>{products.map(p=><option key={p.id} value={p.id}>{p.name} {p.size}</option>)}</select></label><label>Kirim miqdori<input required type="number" min="0.01" step="any" value={form.qty||'1'} onChange={e=>set('qty',e.target.value)}/></label><label>Yangi tannarx ($), ixtiyoriy<input value={form.cost??''} onChange={e=>set('cost',e.target.value)} placeholder="Masalan: 1,32"/></label><label className="span-two">Izoh<input value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="Ta’minotchi yoki hujjat"/></label></div>}
 {modal.type==='expense'&&<div className="form-grid"><label>Xarajat turi<select value={form.type||'Boshqa'} onChange={e=>set('type',e.target.value)}>{['Ijara','Ish haqi','Transport','Kommunal','Ta’minot','Boshqa'].map(x=><option key={x}>{x}</option>)}</select></label><label>Summa ($)<input required value={form.amount||''} onChange={e=>set('amount',e.target.value)} placeholder="Masalan: 10,75"/></label><label className="span-two">Izoh<input value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="Xarajat tafsiloti"/></label></div>}
 {modal.type==='customer'&&<div className="form-grid"><label className="span-two">Mijoz ismi<input required value={form.name||''} onChange={e=>set('name',e.target.value)}/></label><label className="span-two">Telefon<input value={form.phone||''} onChange={e=>set('phone',e.target.value)}/></label></div>}
 {modal.type==='payDebt'&&<><div className="notice">Mijoz: {modal.customer.name} · Joriy qarz: {formatUSD(modal.customer.debt)}</div><div className="form-grid"><label className="span-two">To‘langan summa ($)<input required value={form.amount||''} onChange={e=>set('amount',e.target.value)} placeholder="Masalan: 5,50"/></label></div></>}
 <div className="modal-actions"><button type="button" className="btn light" onClick={close}>Bekor qilish</button><button type="submit" className="btn">Saqlash</button></div></form></div>
}

function ReceiptModal({sale,close,fmt}){
 const date=new Date(sale.date);
 const items=Array.isArray(sale.items)?sale.items:[];
 const paid=Number(sale.paid)||0;
 const due=Math.max(0,(Number(sale.total)||0)-paid);
 return <div className="modal-backdrop receipt-backdrop" onMouseDown={e=>e.target===e.currentTarget&&close()}>
   <section className="modal-card receipt-dialog">
     <div className="modal-header receipt-actions"><div><h2>Savdo cheki</h2><p>Chekni chop eting yoki PDF qilib saqlang.</p></div><button type="button" className="icon-button" onClick={close}><X/></button></div>
     <div className="receipt-print-area">
       <div className="receipt-brand">ZAPCHAST PRO</div>
       <div className="receipt-subtitle">SAVDO CHEKI</div>
       <div className="receipt-divider"/>
       <div className="receipt-meta"><span>Chek №</span><b>{String(sale.id).slice(-8)}</b></div>
       <div className="receipt-meta"><span>Sana</span><b>{date.toLocaleDateString('uz-UZ')} {date.toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'})}</b></div>
       <div className="receipt-meta"><span>Mijoz</span><b>{sale.customer||'Oddiy mijoz'}</b></div>
       <div className="receipt-meta"><span>To‘lov turi</span><b>{sale.payment||'Naqd'}</b></div>
       <div className="receipt-divider"/>
       <table className="receipt-items"><thead><tr><th>Mahsulot</th><th>Soni</th><th>Narx</th><th>Jami</th></tr></thead><tbody>{items.map((item,i)=><tr key={`${item.id||item.name}-${i}`}><td>{item.name}{item.size?` (${item.size})`:''}</td><td>{item.qty}</td><td>{fmt(item.price)}</td><td>{fmt((Number(item.qty)||0)*(Number(item.price)||0))}</td></tr>)}</tbody></table>
       <div className="receipt-divider"/>
       <div className="receipt-total"><span>JAMI</span><strong>{fmt(sale.total)}</strong></div>
       <div className="receipt-meta"><span>To‘landi</span><b>{fmt(paid)}</b></div>
       <div className="receipt-meta"><span>Qoldiq / qarz</span><b>{fmt(due)}</b></div>
       <div className="receipt-divider"/>
       <p className="receipt-thanks">Xaridingiz uchun rahmat!<br/>Yana tashrif buyuring.</p>
     </div>
     <div className="modal-actions receipt-actions"><button type="button" className="btn light" onClick={close}>Yopish</button><button type="button" className="btn" onClick={()=>window.print()}><Receipt size={16}/> Chek chiqarish / PDF</button></div>
   </section>
 </div>;
}

export default App;
