import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Wallet, TrendingUp, ShieldCheck, CalendarDays, RotateCcw, Info, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import "./styles.css";

const money = n => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
const compact = n => !Number.isFinite(n) ? "—" : Math.abs(n)>=1e7 ? `₹${(n/1e7).toFixed(2)} Cr` : Math.abs(n)>=1e5 ? `₹${(n/1e5).toFixed(2)} L` : money(n);
const defaults = {monthly:25000,fdPct:50,fdRate:6,equityRate:12,stepUp:10,years:30,spending:100000,inflation:6};

function calculate(p) {
  const months = Math.max(0,Math.round(p.years*12));
  const fdMonthly = Math.pow(1+p.fdRate/100,1/12)-1;
  const eqMonthly = Math.pow(1+p.equityRate/100,1/12)-1;
  let fd=0, eq=0, contribution=p.monthly;
  const yearly=[];
  for(let m=1;m<=months;m++){
    fd*=1+fdMonthly; eq*=1+eqMonthly;
    fd+=contribution*p.fdPct/100; eq+=contribution*(100-p.fdPct)/100;
    if(m%12===0){yearly.push({year:m/12,balance:fd+eq,fd,equity:eq});contribution*=1+p.stepUp/100;}
  }
  const corpus=fd+eq;
  const retirementMonthlySpend=p.spending*Math.pow(1+p.inflation/100,p.years);
  const inflationMonthly=Math.pow(1+p.inflation/100,1/12)-1;
  let balance=corpus, month=0;
  const retirementData=[{year:0,balance:corpus}];
  const maxMonths=120*12;
  while(balance>0 && month<maxMonths){
    const withdrawal=retirementMonthlySpend*Math.pow(1+inflationMonthly,month);
    // Approximate post-retirement allocation using the retirement corpus proportions.
    const fdShare=corpus>0?fd/corpus:0;
    const nextFd=balance*fdShare*(1+fdMonthly);
    const nextEq=balance*(1-fdShare)*(1+eqMonthly);
    balance=nextFd+nextEq-withdrawal;
    month++;
    if(month%12===0 || balance<=0) retirementData.push({year:month/12,balance:Math.max(0,balance)});
  }
  return {corpus,fd,eq,retirementMonthlySpend,yearsLast:month/12,monthsLast:month,yearly,retirementData};
}
function Field({label,hint,children}){return <label className="field"><span className="field-label">{label}</span>{children}{hint&&<span className="hint">{hint}</span>}</label>}
function NumberInput({value,onChange,min=0,max=100000000,step=1,prefix,suffix}){
 return <div className="number-wrap">{prefix&&<span className="input-affix">{prefix}</span>}<input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>{suffix&&<span className="input-affix">{suffix}</span>}</div>;
}
function App(){
 const [p,setP]=useState(defaults); const [tab,setTab]=useState("overview");
 const update=(key,val)=>setP(old=>({...old,[key]:val}));
 const result=useMemo(()=>calculate(p),[p]);
 const chartData=result.yearly.map(x=>({year:`Year ${x.year}`,"Total corpus":Math.round(x.balance),FD:Math.round(x.fd),Equity:Math.round(x.equity)}));
 const valid=p.monthly>=0&&p.years>0&&p.fdPct>=0&&p.fdPct<=100&&p.inflation>=0&&p.fdRate>-100&&p.equityRate>-100&&p.stepUp>-100&&p.spending>=0;
 const invested=p.monthly*12*(p.stepUp===0?p.years:(Math.pow(1+p.stepUp/100,p.years)-1)/(p.stepUp/100));
 const reset=()=>setP(defaults);
 const years=Math.floor(result.yearsLast), months=result.monthsLast%12;
 return <div className="app-shell">
  <aside className="sidebar"><div className="brand"><div className="brand-icon"><ChartNoAxesCombined size={19}/></div><span>Retirement Planner</span></div><div className="side-label">PLANNING</div>
   <button className={`nav-item ${tab==="overview"?"active":""}`} onClick={()=>setTab("overview")}><Wallet size={17}/> Overview</button>
   <button className={`nav-item ${tab==="growth"?"active":""}`} onClick={()=>setTab("growth")}><TrendingUp size={17}/> Corpus growth</button>
   <div className="sidebar-bottom"><div className="sidebar-note"><ShieldCheck size={17}/><span>Private by design</span></div><p>Your numbers stay in this browser. No account or server required.</p></div>
  </aside>
  <main className="main">
   <header className="topbar"><div><span className="eyebrow">PERSONAL FINANCE / PLANNING TOOL</span><h1>Retirement calculator</h1><p className="subtitle">Build your corpus. Estimate how long it could support your lifestyle.</p></div><button className="reset-btn" onClick={reset}><RotateCcw size={15}/> Reset</button></header>
   <div className="content-grid">
    <section className="panel inputs-panel"><div className="panel-heading"><div><h2>Your plan</h2><p>Adjust assumptions to explore scenarios.</p></div><span className="pill">INR · India</span></div>
     <div className="section-title"><span className="section-icon"><Wallet size={16}/></span> Investment details</div>
     <Field label="Monthly investment" hint="Amount invested each month, starting today"><NumberInput value={p.monthly} onChange={v=>update("monthly",v)} min={0} step={1000} prefix="₹"/></Field>
     <Field label="Annual step-up" hint="How much your monthly contribution rises each year"><NumberInput value={p.stepUp} onChange={v=>update("stepUp",v)} min={-99} max={200} step={1} suffix="% / yr"/></Field>
     <Field label="Years of investing" hint="Accumulation period before retirement"><NumberInput value={p.years} onChange={v=>update("years",Math.min(80,Math.max(1,v)))} min={1} max={80} suffix="years"/></Field>
     <div className="section-title separated"><span className="section-icon"><ShieldCheck size={16}/></span> Asset allocation</div>
     <div className="allocation-header"><span>Fixed deposit (FD)</span><strong>{p.fdPct}%</strong></div>
     <input className="range" type="range" min="0" max="100" step="5" value={p.fdPct} onChange={e=>update("fdPct",Number(e.target.value))} aria-label="FD allocation percentage"/>
     <div className="allocation-ends"><span>0% FD</span><span>{100-p.fdPct}% equity</span><span>100% FD</span></div>
     <div className="allocation-bar"><div style={{width:`${p.fdPct}%`}}/><div style={{width:`${100-p.fdPct}%`}}/></div>
     <div className="two-col"><Field label="FD expected return"><NumberInput value={p.fdRate} onChange={v=>update("fdRate",v)} min={-99} max={100} step={0.5} suffix="%"/></Field><Field label="Equity expected return"><NumberInput value={p.equityRate} onChange={v=>update("equityRate",v)} min={-99} max={100} step={0.5} suffix="%"/></Field></div>
     <div className="section-title separated"><span className="section-icon"><CalendarDays size={16}/></span> Retirement lifestyle</div>
     <Field label="Monthly spending in today's money" hint="The lifestyle you want to afford in today's rupees"><NumberInput value={p.spending} onChange={v=>update("spending",v)} min={0} step={5000} prefix="₹"/></Field>
     <Field label="Annual inflation"><NumberInput value={p.inflation} onChange={v=>update("inflation",v)} min={0} max={30} step={0.5} suffix="% / yr"/></Field>
     <div className="input-footnote"><Info size={15}/><span>FD and equity allocations add up to 100%. No new investments are made after retirement.</span></div>
    </section>
    <section className="results-column">
     <div className="hero-card"><div className="hero-top"><span className="live-dot"/> RETIREMENT OUTLOOK <span className="hero-tag">ESTIMATE</span></div><p className="hero-label">Your savings could last approximately</p><div className="hero-number">{valid?`${years} years${months?`, ${months} mo`:""}`:"—"}</div><p className="hero-sub">{valid?`With inflation-adjusted withdrawals of ${money(p.spending)}/month in today's money.`:"Enter valid assumptions to calculate your estimate."}</p><div className="hero-divider"/><div className="hero-stats"><div><span>Corpus at retirement</span><strong>{compact(result.corpus)}</strong></div><div><span>First month at retirement</span><strong>{compact(result.retirementMonthlySpend)}</strong></div></div></div>
     <div className="metrics-grid">
      <div className="metric-card"><div className="metric-icon purple"><Wallet size={17}/></div><span className="metric-label">Total invested</span><strong>{compact(invested)}</strong><small>Approximate contributions over time</small></div>
      <div className="metric-card"><div className="metric-icon green"><TrendingUp size={17}/></div><span className="metric-label">FD portion at retirement</span><strong>{compact(result.fd)}</strong><small>{p.fdPct}% allocation · {p.fdRate}% assumed return</small></div>
      <div className="metric-card"><div className="metric-icon blue"><ArrowUpRight size={17}/></div><span className="metric-label">Equity portion at retirement</span><strong>{compact(result.eq)}</strong><small>{100-p.fdPct}% allocation · {p.equityRate}% assumed return</small></div>
      <div className="metric-card"><div className="metric-icon amber"><CalendarDays size={17}/></div><span className="metric-label">Spending in retirement year 1</span><strong>{compact(result.retirementMonthlySpend*12)}</strong><small>Annual spending, inflation-adjusted</small></div>
     </div>
     <div className="panel chart-panel"><div className="panel-heading"><div><h2>{tab==="growth"?"Your corpus over time":"Projected portfolio growth"}</h2><p>Estimated account balance during your investment years.</p></div><span className="chart-badge"><span/> Projection</span></div>
      <div className="chart-wrap">{chartData.length?<ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{top:10,right:8,left:4,bottom:0}}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10a37f" stopOpacity={0.24}/><stop offset="95%" stopColor="#10a37f" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#343434" strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year" tick={{fill:"#929292",fontSize:11}} axisLine={false} tickLine={false} minTickGap={28}/><YAxis tickFormatter={v=>compact(v)} tick={{fill:"#929292",fontSize:11}} axisLine={false} tickLine={false} width={65}/><Tooltip contentStyle={{background:"#2b2b2b",border:"1px solid #454545",borderRadius:10,color:"#f4f4f4"}} formatter={v=>money(v)}/><Legend wrapperStyle={{fontSize:12,color:"#b4b4b4"}}/><Area type="monotone" dataKey="Total corpus" stroke="#10a37f" strokeWidth={2.5} fill="url(#equityFill)"/><Area type="monotone" dataKey="FD" stroke="#8b8cf8" strokeWidth={1.5} fill="transparent"/><Area type="monotone" dataKey="Equity" stroke="#60a5fa" strokeWidth={1.5} fill="transparent"/></AreaChart></ResponsiveContainer>:<div className="empty-chart">Your projection will appear here.</div>}</div>
      <div className="chart-footer"><span><span className="legend-dot"/> Returns are assumed constant</span><span>{p.years}-year accumulation period</span></div>
     </div>
     <div className="panel breakdown-panel"><div className="panel-heading"><div><h2>What this estimate assumes</h2><p>Important details behind the result.</p></div></div><div className="assumption-list"><div><span className="check">✓</span><span><b>Monthly contributions</b><small>Investment increases by {p.stepUp}% once each year.</small></span></div><div><span className="check">✓</span><span><b>Inflation-linked spending</b><small>Retirement spending rises by {p.inflation}% yearly, starting from today's target.</small></span></div><div><span className="check">✓</span><span><b>Returns during retirement</b><small>FD and equity returns continue at selected rates; no new contributions.</small></span></div></div></div>
     <div className="disclaimer"><Info size={15}/><p><b>Illustrative projection, not a guarantee.</b> Actual market returns vary and can be negative. Taxes, fees, FD interest taxation, and changes to asset allocation are not included. A fixed 12% equity return every year is not realistic; test lower-return scenarios too.</p></div>
    </section>
   </div>
   <footer>RETIREMENT PLANNER <span>•</span> Built for scenario planning <span>•</span> All calculations run locally</footer>
  </main>
 </div>;
}
createRoot(document.getElementById("root")).render(<App />);
