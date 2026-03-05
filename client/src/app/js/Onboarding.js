import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   TALENDRO APPLY — 10-STEP CANDIDATE ONBOARDING
   Captures 100% of the data needed to complete 95%+ of all
   employment applications automatically.
   ═══════════════════════════════════════════════════════════════ */

// ─── BRAND TOKENS ───
const C = {
  blue: "#2F6DF6",
  aqua: "#00C4CC",
  slate: "#2C2F38",
  lime: "#A4F400",
  gray: "#9FA6B2",
  lightBg: "#F9FAFB",
  white: "#FFFFFF",
  redBg: "rgba(239, 68, 68, 0.08)",
  redBorder: "rgba(239, 68, 68, 0.35)",
  greenBg: "rgba(16, 185, 129, 0.08)",
  greenBorder: "rgba(16, 185, 129, 0.35)",
  focusRing: "0 0 0 3px rgba(47, 109, 246, 0.2)",
};

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const STEPS = [
  { id: "resume",      label: "Resume" },
  { id: "personal",    label: "Personal" },
  { id: "work-auth",   label: "Authorization" },
  { id: "employment",  label: "Employment" },
  { id: "addresses",   label: "Addresses" },
  { id: "education",   label: "Education" },
  { id: "certs-skills",label: "Certs & Skills" },
  { id: "references",  label: "References" },
  { id: "preferences", label: "Preferences" },
  { id: "disclosures", label: "Disclosures" },
  { id: "review",      label: "Review" },
];

// ─── EMPTY RECORDS ───
const EMPTY_JOB  = { company:"",title:"",empType:"",startDate:"",endDate:"",currentlyHere:false,city:"",state:"",duties:"",reason:"",startSalary:"",endSalary:"",salaryType:"",supervisorName:"",supervisorTitle:"",supervisorPhone:"",supervisorEmail:"",mayContact:"" };
const EMPTY_GAP  = { type:"gap",category:"",startDate:"",endDate:"",isCurrent:false,description:"" };
const EMPTY_ADDR = { street:"",apt:"",city:"",county:"",state:"",zip:"",country:"United States",moveIn:"",moveOut:"",isCurrent:false };
const EMPTY_EDU  = { institution:"",city:"",state:"",country:"United States",degreeType:"",major:"",minor:"",startDate:"",endDate:"",enrolled:"",graduated:"",gpa:"",honors:"",coursework:"" };
const EMPTY_CERT = { name:"",org:"",issueDate:"",expDate:"",noExpire:false,number:"",stateIssued:"",active:"" };
const EMPTY_SKILL= { name:"",proficiency:"",years:"" };
const EMPTY_LANG = { name:"",speaking:"",reading:"",writing:"" };
const EMPTY_SW   = { name:"",proficiency:"" };
const EMPTY_REF  = { name:"",title:"",company:"",phone:"",email:"",relationship:"",howLong:"",mayContact:"" };

// ─── VALIDATION ───
const rc = (value) => {
  if (value === undefined || value === null || value === "" || value === false)
    return { background: C.redBg, borderColor: C.redBorder };
  return { background: C.white, borderColor: "#d1d5db" };
};
const focusStyle = { background: C.white, borderColor: C.blue, outline: "none", boxShadow: C.focusRing };
const baseInput  = { width:"100%",padding:"10px 14px",borderRadius:8,border:"1.5px solid #d1d5db",fontSize:14,fontFamily:"'Inter', sans-serif",color:C.slate,transition:"all 0.2s",boxSizing:"border-box" };

// ─── PRIMITIVE COMPONENTS ───
const SectionHeader = ({ icon, title, color=C.aqua, subtitle }) => (
  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,marginTop:8 }}>
    <div style={{ width:32,height:32,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <span style={{ color:"#fff",fontSize:14,fontWeight:700 }}>{icon}</span>
    </div>
    <div>
      <h3 style={{ margin:0,fontSize:18,fontWeight:700,color:C.slate,fontFamily:"'Montserrat', sans-serif" }}>{title}</h3>
      {subtitle && <p style={{ margin:"2px 0 0",fontSize:13,color:C.gray }}>{subtitle}</p>}
    </div>
  </div>
);

const Label = ({ children }) => (
  <label style={{ display:"block",fontSize:13,fontWeight:600,color:C.slate,marginBottom:6,fontFamily:"'Inter', sans-serif" }}>{children}</label>
);

const Hint = ({ children }) => children ? (
  <p style={{ fontSize:12,fontWeight:400,color:C.gray,marginTop:4,fontFamily:"'Inter', sans-serif" }}>{children}</p>
) : null;

const Input = ({ label, hint, required, value, onChange, type="text", placeholder, naAllowed, disabled, style:sx, ...props }) => {
  const [focused, setFocused] = useState(false);
  const isNA = value === "N/A";
  const fieldStyle = required ? rc(value) : {};
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <div style={{ position:"relative" }}>
        <input type={type} value={isNA ? "N/A" : (value||"")} disabled={isNA||disabled}
          onChange={e => onChange(e.target.value)} placeholder={placeholder||""}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...baseInput,...(focused?focusStyle:fieldStyle),...(isNA?{background:"#f3f4f6",color:C.gray}:{}),...(naAllowed?{paddingRight:54}:{}) }}
          {...props} />
        {naAllowed && (
          <button type="button" onClick={() => onChange(isNA ? "" : "N/A")}
            style={{ position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",padding:"4px 10px",borderRadius:5,border:`1px solid ${isNA?C.blue:"#d1d5db"}`,fontSize:11,fontWeight:700,cursor:"pointer",background:isNA?C.blue:C.white,color:isNA?C.white:C.gray,fontFamily:"'Inter', sans-serif",transition:"all 0.2s",lineHeight:1 }}>
            N/A
          </button>
        )}
      </div>
      <Hint>{hint}</Hint>
    </div>
  );
};

const Select = ({ label, hint, required, value, onChange, options, placeholder, style:sx }) => {
  const [focused, setFocused] = useState(false);
  const fieldStyle = required ? rc(value) : {};
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <select value={value||""} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...baseInput,...(focused?focusStyle:fieldStyle),color:value?C.slate:C.gray,cursor:"pointer" }}>
        <option value="">{placeholder||`Select ${label||""}`}</option>
        {options.map(o => typeof o==="string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <Hint>{hint}</Hint>
    </div>
  );
};

const YesNo = ({ label, hint, required, value, onChange, style:sx }) => {
  const empty = !value;
  const fieldBg = required&&empty ? C.redBg : C.white;
  const fieldBd = required&&empty ? C.redBorder : "#d1d5db";
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <div style={{ display:"flex",gap:8 }}>
        {["Yes","No"].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{ flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${value===v?C.blue:fieldBd}`,fontSize:14,fontWeight:value===v?700:400,cursor:"pointer",background:value===v?C.blue:fieldBg,color:value===v?C.white:C.slate,fontFamily:"'Inter', sans-serif",transition:"all 0.2s" }}>
            {v}
          </button>
        ))}
      </div>
      <Hint>{hint}</Hint>
    </div>
  );
};

const YesNoNA = ({ label, hint, required, value, onChange, style:sx }) => {
  const empty = !value;
  const fieldBg = required&&empty ? C.redBg : C.white;
  const fieldBd = required&&empty ? C.redBorder : "#d1d5db";
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <div style={{ display:"flex",gap:8 }}>
        {["Yes","No","N/A"].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            style={{ flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${value===v?C.blue:fieldBd}`,fontSize:14,fontWeight:value===v?700:400,cursor:"pointer",background:value===v?C.blue:fieldBg,color:value===v?C.white:C.slate,fontFamily:"'Inter', sans-serif",transition:"all 0.2s" }}>
            {v}
          </button>
        ))}
      </div>
      <Hint>{hint}</Hint>
    </div>
  );
};

const TextArea = ({ label, hint, required, value, onChange, rows=4, placeholder, style:sx }) => {
  const [focused, setFocused] = useState(false);
  const fieldStyle = required ? rc(value) : {};
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <textarea value={value||""} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder||""} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...baseInput,...(focused?focusStyle:fieldStyle),resize:"vertical",lineHeight:1.6 }} />
      <Hint>{hint}</Hint>
    </div>
  );
};

const Checkbox = ({ label, checked, onChange, style:sx }) => (
  <label style={{ display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",fontSize:14,fontFamily:"'Inter', sans-serif",color:C.slate,...sx }}>
    <input type="checkbox" checked={checked||false} onChange={e => onChange(e.target.checked)}
      style={{ marginTop:3,width:18,height:18,accentColor:C.blue }} />
    <span>{label}</span>
  </label>
);

const Grid = ({ cols=2, gap=16, children }) => (
  <div style={{ display:"grid",gridTemplateColumns:`repeat(${cols}, 1fr)`,gap }}>{children}</div>
);

const MultiSelect = ({ label, hint, required, value=[], onChange, options, style:sx }) => {
  const hasValue = value.length > 0;
  const borderColor = required&&!hasValue ? C.redBorder : "#d1d5db";
  const bgColor     = required&&!hasValue ? C.redBg : C.white;
  return (
    <div style={sx}>
      {label && <Label>{label}</Label>}
      <div style={{ padding:"10px 14px",borderRadius:8,border:`1.5px solid ${borderColor}`,background:bgColor,transition:"all 0.2s" }}>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {options.map(o => {
            const val = typeof o==="string" ? o : o.value;
            const lbl = typeof o==="string" ? o : o.label;
            const checked = value.includes(val);
            return (
              <button key={val} type="button" onClick={() => {
                if (checked) onChange(value.filter(v => v!==val));
                else onChange([...value, val]);
              }}
                style={{ padding:"6px 14px",borderRadius:20,border:`1.5px solid ${checked?C.blue:"#d1d5db"}`,fontSize:13,fontWeight:checked?600:400,cursor:"pointer",background:checked?C.blue:C.white,color:checked?C.white:C.slate,fontFamily:"'Inter', sans-serif",transition:"all 0.15s" }}>
                {lbl}
              </button>
            );
          })}
        </div>
      </div>
      <Hint>{hint}</Hint>
    </div>
  );
};

const InfoBox = ({ children, color="#FEF9C3", border="#FDE68A", textColor="#92400E" }) => (
  <div style={{ padding:"12px 16px",background:color,border:`1px solid ${border}`,borderRadius:8,fontSize:13,color:textColor,fontFamily:"'Inter', sans-serif",lineHeight:1.5 }}>{children}</div>
);

const CoverageBar = ({ label, emoji, current, target, unit }) => {
  const pct = Math.min(100, Math.round((current/target)*100));
  return (
    <div style={{ padding:"14px 18px",background:C.lightBg,border:"1px solid #e5e7eb",borderRadius:10,marginBottom:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
        <span style={{ fontSize:13,fontWeight:600,color:C.slate,fontFamily:"'Inter', sans-serif" }}>{emoji} {label}: {current} {unit}</span>
        <span style={{ fontSize:13,fontWeight:700,color:pct>=100?"#10B981":C.blue }}>{pct}% complete</span>
      </div>
      <div style={{ height:8,background:"#e5e7eb",borderRadius:4,overflow:"hidden" }}>
        <div style={{ height:"100%",width:`${pct}%`,background:pct>=100?"#10B981":C.blue,borderRadius:4,transition:"width 0.5s ease" }} />
      </div>
      {pct<100 && <p style={{ fontSize:12,color:C.gray,marginTop:6 }}>Add positions going back to reach {target} {unit}</p>}
    </div>
  );
};

const Repeater = ({ items, setItems, empty, renderItem, addLabel, min=0 }) => (
  <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
    {items.map((item, i) => (
      <div key={i} style={{ border:"1.5px solid #e5e7eb",borderRadius:12,padding:20,background:i%2===0?C.lightBg:C.white }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:14,fontWeight:700,color:C.slate,fontFamily:"'Montserrat', sans-serif" }}>Entry {i+1}</span>
          {items.length>min && (
            <button type="button" onClick={() => { const n=[...items]; n.splice(i,1); setItems(n); }}
              style={{ padding:"4px 14px",border:"1px solid #ef4444",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:C.white,color:"#ef4444",fontFamily:"'Inter', sans-serif" }}>
              Remove
            </button>
          )}
        </div>
        {renderItem(item, i, (f,v) => { const n=[...items]; n[i]={...n[i],[f]:v}; setItems(n); })}
      </div>
    ))}
    <button type="button" onClick={() => setItems([...items,{...empty}])}
      style={{ padding:"14px 0",border:"2px dashed #d1d5db",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",background:"transparent",color:C.blue,fontFamily:"'Inter', sans-serif",transition:"all 0.2s" }}
      onMouseEnter={e => { e.target.style.borderColor=C.blue; e.target.style.background="rgba(47,109,246,0.04)"; }}
      onMouseLeave={e => { e.target.style.borderColor="#d1d5db"; e.target.style.background="transparent"; }}>
      + {addLabel}
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════════
//  STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════

const StepResume = ({ data, set, onParsed }) => {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [parseResult, setParseResult] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set({ ...data, resume: file.name });
    setError(""); setParsing(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resume/parse", { method:"POST", body:formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Parse failed");
      setParseResult(result.meta);
      onParsed(result.data);
    } catch (err) {
      setError(err.message || "Failed to parse resume. You can still enter info manually.");
    } finally { setParsing(false); }
  };

  return (
    <div>
      <SectionHeader icon="📄" title="Upload Your Resume" color={C.blue} subtitle="We'll parse your resume to pre-fill as many fields as possible." />
      <InfoBox>
        <strong>How it works:</strong> Upload your resume and our AI will extract your work history, education, skills, and contact info. You'll review and verify everything on the next screens. Your original is stored securely — AI generates optimized versions for each application.
      </InfoBox>
      <div style={{ marginTop:20,border:`2px dashed ${parsing?C.blue:data.resume?"#10B981":"#d1d5db"}`,borderRadius:12,padding:48,textAlign:"center",background:parsing?"rgba(47,109,246,0.04)":data.resume?"rgba(16,185,129,0.04)":C.lightBg,cursor:parsing?"wait":"pointer",transition:"all 0.2s" }}>
        <input type="file" accept=".pdf,.doc,.docx,.txt" id="resume-upload" style={{ display:"none" }} onChange={handleUpload} disabled={parsing} />
        <label htmlFor="resume-upload" style={{ cursor:parsing?"wait":"pointer" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>{parsing?"⏳":data.resume?"✅":"📤"}</div>
          <p style={{ fontSize:16,fontWeight:600,color:parsing?C.blue:data.resume?"#10B981":C.slate,fontFamily:"'Montserrat', sans-serif" }}>
            {parsing?"AI is parsing your resume...":data.resume||"Click to upload your resume"}
          </p>
          <p style={{ fontSize:13,color:C.gray,marginTop:4 }}>
            {parsing?"This usually takes 5–10 seconds":"PDF, Word, or Text format (.pdf, .doc, .docx, .txt)"}
          </p>
        </label>
      </div>
      {parsing && (
        <div style={{ marginTop:16,padding:16,background:"rgba(47,109,246,0.04)",border:"1px solid rgba(47,109,246,0.2)",borderRadius:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:20,height:20,border:`3px solid ${C.blue}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite" }} />
            <span style={{ fontSize:13,color:C.blue,fontWeight:600 }}>Extracting personal info, work history, education, skills...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      {error && (
        <div style={{ marginTop:16,padding:14,background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,fontSize:13,color:"#991B1B" }}>
          ⚠️ {error}
        </div>
      )}
      {parseResult && !parsing && (
        <div style={{ marginTop:16,padding:16,background:"rgba(16,185,129,0.04)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:10 }}>
          <p style={{ fontSize:14,fontWeight:700,color:"#065F46",marginBottom:4 }}>✅ Resume parsed successfully</p>
          <p style={{ fontSize:13,color:"#047857" }}>
            {parseResult.fieldsPopulated} of {parseResult.fieldsTotal} fields pre-filled ({parseResult.fillRate}% fill rate). Click Continue to review and complete the remaining fields.
          </p>
        </div>
      )}
      <div style={{ textAlign:"center",margin:"24px 0" }}>
        <div style={{ display:"flex",alignItems:"center",gap:16 }}>
          <div style={{ flex:1,height:1,background:"#e5e7eb" }} />
          <span style={{ fontSize:13,fontWeight:600,color:C.gray }}>OR</span>
          <div style={{ flex:1,height:1,background:"#e5e7eb" }} />
        </div>
      </div>
      <button type="button" style={{ width:"100%",padding:14,border:`1.5px solid ${C.blue}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",background:C.white,color:C.blue,fontFamily:"'Inter', sans-serif" }}>
        Skip — I'll enter my information manually
      </button>
    </div>
  );
};

const StepPersonal = ({ data, set }) => {
  const u = f => v => set({ ...data, [f]:v });
  return (
    <div>
      <SectionHeader icon="👤" title="Personal Information" color={C.blue} subtitle="Fields pre-filled from your resume. Verify and correct as needed." />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Legal Identity</h4>
      <Grid cols={3}>
        <Input label="First Name" required value={data.firstName} onChange={u("firstName")} />
        <Input label="Middle Name" required value={data.middleName} onChange={u("middleName")} naAllowed />
        <Input label="Last Name" required value={data.lastName} onChange={u("lastName")} />
      </Grid>
      <div style={{ height:16 }} />
      <Grid cols={3}>
        <Select label="Suffix" required value={data.suffix} onChange={u("suffix")} options={[{value:"N/A",label:"N/A — None"},{value:"Jr",label:"Jr"},{value:"Sr",label:"Sr"},{value:"II",label:"II"},{value:"III",label:"III"},{value:"IV",label:"IV"},{value:"V",label:"V"}]} />
        <Input label="Maiden / Former Name" required value={data.maidenName} onChange={u("maidenName")} naAllowed />
        <Input label="Preferred Name / Nickname" required value={data.preferredName} onChange={u("preferredName")} naAllowed />
      </Grid>
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Sensitive Information</h4>
      <InfoBox color="rgba(47,109,246,0.06)" border="rgba(47,109,246,0.2)" textColor={C.slate}>
        This data cannot be parsed from your resume — you must provide it directly. It is encrypted and stored securely.
      </InfoBox>
      <div style={{ height:12 }} />
      <Grid cols={3}>
        <Input label="Date of Birth" required type="date" value={data.dob} onChange={u("dob")} hint="Required for background checks" />
        <Input label="Last 4 of SSN" required value={data.ssn4} onChange={u("ssn4")} placeholder="1234" maxLength={4} />
        <div />
      </Grid>
      <div style={{ height:16 }} />
      <Grid cols={3}>
        <Input label="Driver's License Number" required value={data.dlNumber} onChange={u("dlNumber")} naAllowed />
        <Select label="DL State" required value={data.dlState} onChange={u("dlState")} options={[{value:"N/A",label:"N/A — No License"},...US_STATES.map(s=>({value:s,label:s}))]} />
        <Input label="DL Expiration" required type="date" value={data.dlExp} onChange={u("dlExp")} naAllowed />
      </Grid>
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Contact Information</h4>
      <Grid cols={2}>
        <Input label="Email Address" required type="email" value={data.email} onChange={u("email")} />
        <Input label="Phone Number" required type="tel" value={data.phone} onChange={u("phone")} placeholder="(555) 123-4567" />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={3}>
        <Select label="Phone Type" required value={data.phoneType} onChange={u("phoneType")} options={["Mobile","Home","Work"]} />
        <Select label="Preferred Contact Method" required value={data.contactMethod} onChange={u("contactMethod")} options={["Phone","SMS","Email"]} />
        <Select label="Best Time to Contact" required value={data.bestTime} onChange={u("bestTime")} options={["Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)"]} />
      </Grid>
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Online Presence</h4>
      <Grid cols={2}>
        <Input label="LinkedIn URL" required value={data.linkedin} onChange={u("linkedin")} placeholder="https://linkedin.com/in/yourname" naAllowed />
        <Input label="Personal Website / Portfolio" required value={data.website} onChange={u("website")} naAllowed />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <Input label="GitHub / GitLab" required value={data.github} onChange={u("github")} naAllowed hint="For technical roles" />
        <Input label="Other Professional URL" required value={data.otherUrl} onChange={u("otherUrl")} naAllowed />
      </Grid>
    </div>
  );
};

const StepWorkAuth = ({ data, set }) => {
  const u = f => v => set({ ...data, [f]:v });
  return (
    <div>
      <SectionHeader icon="✓" title="Work Authorization" color="#10B981" subtitle="Required by most US employers." />
      <Grid cols={2}>
        <YesNo label="Authorized to work in the US?" required value={data.workAuth} onChange={u("workAuth")} />
        <YesNo label="Are you a US citizen?" required value={data.usCitizen} onChange={u("usCitizen")} />
      </Grid>
      <div style={{ height:16 }} />
      <Grid cols={2}>
        <YesNo label="Require sponsorship now?" required value={data.sponsorNow} onChange={u("sponsorNow")} />
        <YesNo label="Require sponsorship in the future?" required value={data.sponsorFuture} onChange={u("sponsorFuture")} />
      </Grid>
      <div style={{ height:16 }} />
      <Grid cols={3}>
        <YesNoNA label="Green Card Holder?" required value={data.greenCard} onChange={u("greenCard")} />
        <Select label="Visa Type" required value={data.visaType} onChange={u("visaType")} options={[{value:"N/A",label:"N/A — Not Applicable"},{value:"H1B",label:"H-1B"},{value:"H4 EAD",label:"H-4 EAD"},{value:"L1",label:"L-1"},{value:"L2 EAD",label:"L-2 EAD"},{value:"OPT",label:"OPT"},{value:"CPT",label:"CPT"},{value:"TN",label:"TN"},{value:"E2",label:"E-2"},{value:"O1",label:"O-1"},{value:"J1",label:"J-1"},{value:"F1",label:"F-1"},{value:"Other",label:"Other"}]} />
        <Input label="Visa Expiration" required type="date" value={data.visaExp} onChange={u("visaExp")} naAllowed />
      </Grid>
      <div style={{ height:32 }} />
      <SectionHeader icon="⚡" title="Employment Eligibility" color="#F59E0B" />
      <Grid cols={2}>
        <YesNo label="Are you 18 years or older?" required value={data.over18} onChange={u("over18")} />
        <YesNo label="Can provide proof of eligibility (I-9)?" required value={data.i9Proof} onChange={u("i9Proof")} />
      </Grid>
      <div style={{ height:16 }} />
      <Grid cols={2}>
        <YesNo label="Have reliable transportation?" required value={data.transport} onChange={u("transport")} />
        <YesNo label="Willing to submit to drug test?" required value={data.drugTest} onChange={u("drugTest")} />
      </Grid>
      <div style={{ height:12 }} />
      <YesNo label="Willing to submit to background check?" required value={data.bgCheck} onChange={u("bgCheck")} style={{ maxWidth:420 }} />
      <div style={{ height:32 }} />
      <SectionHeader icon="🚨" title="Emergency Contact" color="#EF4444" />
      <Grid cols={2}>
        <Input label="Contact Name" required value={data.emergName} onChange={u("emergName")} />
        <Select label="Relationship" required value={data.emergRelation} onChange={u("emergRelation")} options={["Spouse","Partner","Parent","Sibling","Child","Friend","Other"]} />
      </Grid>
      <div style={{ height:12 }} />
      <Input label="Phone" required type="tel" value={data.emergPhone} onChange={u("emergPhone")} style={{ maxWidth:420 }} />
    </div>
  );
};

const StepEmployment = ({ data, set }) => {
  const entries = data.entries || [{ ...EMPTY_JOB }];
  const setEntries = e => set({ ...data, entries:e });
  let totalMonths = 0;
  entries.forEach(e => {
    if (e.startDate) {
      const start = new Date(e.startDate+"-01");
      const end = (e.currentlyHere||e.isCurrent) ? new Date() : (e.endDate ? new Date(e.endDate+"-01") : new Date());
      totalMonths += Math.max(0,(end-start)/(1000*60*60*24*30.44));
    }
  });
  const yrs = (totalMonths/12).toFixed(1);
  const addJob = () => setEntries([...entries,{...EMPTY_JOB}]);
  const addGap = () => setEntries([...entries,{...EMPTY_GAP}]);
  const remove = i => { const n=[...entries]; n.splice(i,1); setEntries(n); };
  const upd = (i,f,v) => { const n=[...entries]; n[i]={...n[i],[f]:v}; setEntries(n); };
  return (
    <div>
      <SectionHeader icon="💼" title="Employment History" color={C.blue} subtitle="Most recent first. 10 years coverage recommended." />
      <CoverageBar label="Employment Coverage" emoji="📊" current={parseFloat(yrs)} target={10} unit="years" />
      <div style={{ height:8 }} />
      <InfoBox color="rgba(139,92,246,0.06)" border="rgba(139,92,246,0.2)" textColor="#5B21B6">
        <strong>Less than 10 years of work experience?</strong> Use "Add Non-Work Period" below for time spent in school, military service, homemaking, career breaks, etc. These count toward your coverage timeline.
      </InfoBox>
      <div style={{ height:16 }} />
      <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
        {entries.map((item,i) => {
          const isGap = item.type==="gap";
          if (isGap) return (
            <div key={i} style={{ border:"1.5px solid #c4b5fd",borderRadius:12,padding:20,background:"rgba(139,92,246,0.04)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontSize:14,fontWeight:700,color:"#5B21B6",fontFamily:"'Montserrat', sans-serif" }}>📋 Non-Work Period {i+1}</span>
                <button type="button" onClick={() => remove(i)} style={{ padding:"4px 14px",border:"1px solid #ef4444",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:C.white,color:"#ef4444",fontFamily:"'Inter', sans-serif" }}>Remove</button>
              </div>
              <Select label="Category" required value={item.category} onChange={v=>upd(i,"category",v)} options={["Full-Time Student","Active Duty Military","Military Spouse / Dependent","Homemaker / Family Caregiver","Medical Leave / Disability","Career Break / Sabbatical","Volunteer Work","Job Searching","Freelancing / Consulting","Travel","Incarceration","Other"]} />
              <div style={{ height:12 }} />
              <Grid cols={2}>
                <Input label="Start Date" required type="month" value={item.startDate} onChange={v=>upd(i,"startDate",v)} />
                <div>
                  <Input label="End Date" required={!item.isCurrent} type="month" value={item.endDate} onChange={v=>upd(i,"endDate",v)} disabled={item.isCurrent} />
                  <div style={{ marginTop:8 }}><Checkbox label="This is my current situation" checked={item.isCurrent} onChange={v=>{upd(i,"isCurrent",v); if(v) upd(i,"endDate","");}} /></div>
                </div>
              </Grid>
              <div style={{ height:12 }} />
              <TextArea label="Brief Description (Optional)" value={item.description} onChange={v=>upd(i,"description",v)} rows={2} placeholder="e.g., Completed Bachelor's degree at University of Florida..." />
            </div>
          );
          const endRequired = !item.currentlyHere;
          return (
            <div key={i} style={{ border:"1.5px solid #e5e7eb",borderRadius:12,padding:20,background:i%2===0?C.lightBg:C.white }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                <span style={{ fontSize:14,fontWeight:700,color:C.slate,fontFamily:"'Montserrat', sans-serif" }}>💼 Position {i+1}</span>
                {entries.length>1 && <button type="button" onClick={() => remove(i)} style={{ padding:"4px 14px",border:"1px solid #ef4444",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",background:C.white,color:"#ef4444",fontFamily:"'Inter', sans-serif" }}>Remove</button>}
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                <Grid cols={2}>
                  <Input label="Company / Employer Name" required value={item.company} onChange={v=>upd(i,"company",v)} />
                  <Input label="Job Title" required value={item.title} onChange={v=>upd(i,"title",v)} />
                </Grid>
                <Grid cols={2}>
                  <Input label="City" required value={item.city} onChange={v=>upd(i,"city",v)} />
                  <Select label="State" required value={item.state} onChange={v=>upd(i,"state",v)} options={US_STATES.map(s=>({value:s,label:s}))} />
                </Grid>
                <Grid cols={3}>
                  <Select label="Employment Type (Optional)" value={item.empType} onChange={v=>upd(i,"empType",v)} options={["Full-Time","Part-Time","Contract","Temporary","Internship","Freelance/Self-employed"]} />
                  <Input label="Start Date" required type="month" value={item.startDate} onChange={v=>upd(i,"startDate",v)} />
                  <div>
                    <Input label="End Date" required={endRequired} type="month" value={item.endDate} onChange={v=>upd(i,"endDate",v)} disabled={item.currentlyHere} />
                    <div style={{ marginTop:8 }}><Checkbox label="I currently work here" checked={item.currentlyHere} onChange={v=>{upd(i,"currentlyHere",v); if(v) upd(i,"endDate","");}} /></div>
                  </div>
                </Grid>
                <Grid cols={2}>
                  <Select label="May We Contact?" required value={item.mayContact} onChange={v=>upd(i,"mayContact",v)} options={["Yes","No","Only After Offer"]} hint="Critical for current employer" />
                  <div />
                </Grid>
                <Grid cols={3}>
                  <Input label="Starting Salary (Optional)" value={item.startSalary} onChange={v=>upd(i,"startSalary",v)} placeholder="$" />
                  <Input label="Ending Salary (Optional)" value={item.endSalary} onChange={v=>upd(i,"endSalary",v)} placeholder="$" />
                  <Select label="Salary Type (Optional)" value={item.salaryType} onChange={v=>upd(i,"salaryType",v)} options={["Annual","Hourly"]} />
                </Grid>
                <div style={{ borderTop:"1px solid #e5e7eb",paddingTop:14,marginTop:4 }}>
                  <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Supervisor</h4>
                  <Grid cols={2}>
                    <Input label="Supervisor Name" required value={item.supervisorName} onChange={v=>upd(i,"supervisorName",v)} />
                    <Input label="Supervisor Title" required value={item.supervisorTitle} onChange={v=>upd(i,"supervisorTitle",v)} />
                  </Grid>
                  <div style={{ height:12 }} />
                  <Grid cols={2}>
                    <Input label="Supervisor Phone" required={!item.supervisorEmail} type="tel" value={item.supervisorPhone} onChange={v=>upd(i,"supervisorPhone",v)} hint="Phone or email required" />
                    <Input label="Supervisor Email" required={!item.supervisorPhone} type="email" value={item.supervisorEmail} onChange={v=>upd(i,"supervisorEmail",v)} hint="Phone or email required" />
                  </Grid>
                </div>
                <Input label="Reason for Leaving" required value={item.reason} onChange={v=>upd(i,"reason",v)} />
                <TextArea label="Job Duties / Responsibilities" required value={item.duties} onChange={v=>upd(i,"duties",v)} rows={4} placeholder="Describe your key responsibilities and contributions..." />
              </div>
            </div>
          );
        })}
        <div style={{ display:"flex",gap:12 }}>
          <button type="button" onClick={addJob} style={{ flex:1,padding:"14px 0",border:"2px dashed #d1d5db",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",background:"transparent",color:C.blue,fontFamily:"'Inter', sans-serif",transition:"all 0.2s" }}
            onMouseEnter={e=>{e.target.style.borderColor=C.blue;e.target.style.background="rgba(47,109,246,0.04)";}}
            onMouseLeave={e=>{e.target.style.borderColor="#d1d5db";e.target.style.background="transparent";}}>
            + Add Another Position
          </button>
          <button type="button" onClick={addGap} style={{ flex:1,padding:"14px 0",border:"2px dashed #c4b5fd",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",background:"transparent",color:"#5B21B6",fontFamily:"'Inter', sans-serif",transition:"all 0.2s" }}
            onMouseEnter={e=>{e.target.style.borderColor="#8B5CF6";e.target.style.background="rgba(139,92,246,0.04)";}}
            onMouseLeave={e=>{e.target.style.borderColor="#c4b5fd";e.target.style.background="transparent";}}>
            + Add Non-Work Period
          </button>
        </div>
      </div>
    </div>
  );
};

const StepAddresses = ({ data, set }) => {
  const current = data.current || { ...EMPTY_ADDR, isCurrent:true };
  const setCurrent = c => set({ ...data, current:c });
  const history = data.history || [];
  const setHistory = h => set({ ...data, history:h });
  let totalMonths = 0;
  [current,...history].forEach(a => {
    if (a.moveIn) {
      const start = new Date(a.moveIn+"-01");
      const end = a.isCurrent ? new Date() : (a.moveOut ? new Date(a.moveOut+"-01") : new Date());
      totalMonths += Math.max(0,(end-start)/(1000*60*60*24*30.44));
    }
  });
  const yrs = (totalMonths/12).toFixed(1);
  const uc = f => v => setCurrent({ ...current, [f]:v });
  return (
    <div>
      <SectionHeader icon="🏠" title="Address History" color="#8B5CF6" subtitle="7 years minimum for background check coverage." />
      <CoverageBar label="Address Coverage" emoji="🏠" current={parseFloat(yrs)} target={7} unit="years" />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Current Address</h4>
      <Grid cols={2}><Input label="Street Address" required value={current.street} onChange={uc("street")} style={{ gridColumn:"1 / -1" }} /></Grid>
      <div style={{ height:12 }} />
      <Grid cols={3}>
        <Input label="Apt / Unit / Suite (Optional)" value={current.apt} onChange={uc("apt")} naAllowed />
        <Input label="City" required value={current.city} onChange={uc("city")} />
        <Input label="County" required value={current.county} onChange={uc("county")} hint="Required for background checks" />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={3}>
        <Select label="State" required value={current.state} onChange={uc("state")} options={US_STATES.map(s=>({value:s,label:s}))} />
        <Input label="ZIP Code" required value={current.zip} onChange={uc("zip")} />
        <Input label="Country" required value={current.country||"United States"} onChange={uc("country")} />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <Input label="Move-In Date" required type="month" value={current.moveIn} onChange={uc("moveIn")} />
        <div>
          <Input label="Move-Out Date" required={!current.isCurrent} type="month" value={current.moveOut} onChange={uc("moveOut")} disabled={current.isCurrent} />
          <div style={{ marginTop:8 }}><Checkbox label="I currently reside here" checked={current.isCurrent} onChange={v=>{setCurrent({...current,isCurrent:v,moveOut:v?"":current.moveOut});}} /></div>
        </div>
      </Grid>
      <div style={{ height:32 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Previous Addresses</h4>
      <Repeater items={history} setItems={setHistory} empty={EMPTY_ADDR} addLabel="Add Previous Address"
        renderItem={(item,i,upd) => (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <Input label="Street Address" required value={item.street} onChange={v=>upd("street",v)} />
            <Grid cols={3}>
              <Input label="Apt / Unit / Suite (Optional)" value={item.apt} onChange={v=>upd("apt",v)} naAllowed />
              <Input label="City" required value={item.city} onChange={v=>upd("city",v)} />
              <Input label="County" required value={item.county} onChange={v=>upd("county",v)} />
            </Grid>
            <Grid cols={3}>
              <Select label="State / Province" required value={item.state} onChange={v=>upd("state",v)} options={US_STATES.map(s=>({value:s,label:s}))} />
              <Input label="ZIP / Postal Code" required value={item.zip} onChange={v=>upd("zip",v)} />
              <Input label="Country (Optional)" value={item.country||"United States"} onChange={v=>upd("country",v)} />
            </Grid>
            <Grid cols={2}>
              <Input label="Move-In Date" required type="month" value={item.moveIn} onChange={v=>upd("moveIn",v)} />
              <div>
                <Input label="Move-Out Date" required={!item.isCurrent} type="month" value={item.moveOut} onChange={v=>upd("moveOut",v)} disabled={item.isCurrent} />
                <div style={{ marginTop:8 }}><Checkbox label="I currently reside here" checked={item.isCurrent} onChange={v=>{upd("isCurrent",v); if(v) upd("moveOut","");}} /></div>
              </div>
            </Grid>
          </div>
        )}
      />
    </div>
  );
};

const StepEducation = ({ data, set }) => (
  <div>
    <SectionHeader icon="🎓" title="Education" color="#8B5CF6" subtitle="List all degrees, highest first." />
    <Repeater items={data.schools||[{...EMPTY_EDU}]} setItems={s=>set({...data,schools:s})} empty={EMPTY_EDU} addLabel="Add Another School" min={1}
      renderItem={(item,i,upd) => (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Grid cols={2}>
            <Input label="Institution Name" required value={item.institution} onChange={v=>upd("institution",v)} />
            <Select label="Degree Type" required value={item.degreeType} onChange={v=>upd("degreeType",v)} options={["High School Diploma / GED","Associate's","Bachelor's","Master's","Doctorate / PhD","Professional (JD, MD, etc.)","Certificate / Diploma","Some College (No Degree)"]} />
          </Grid>
          <Grid cols={3}>
            <Input label="City" required value={item.city} onChange={v=>upd("city",v)} />
            <Select label="State" required value={item.state} onChange={v=>upd("state",v)} options={US_STATES.map(s=>({value:s,label:s}))} />
            <Input label="Country (Optional)" value={item.country||"United States"} onChange={v=>upd("country",v)} />
          </Grid>
          <Grid cols={2}>
            <Input label="Field of Study / Major" required value={item.major} onChange={v=>upd("major",v)} />
            <Input label="Minor (Optional)" value={item.minor} onChange={v=>upd("minor",v)} />
          </Grid>
          <Grid cols={3}>
            <Input label="Start Date" required type="month" value={item.startDate} onChange={v=>upd("startDate",v)} />
            <Input label="End Date / Graduation" required type="month" value={item.endDate} onChange={v=>upd("endDate",v)} />
            <Input label="GPA (Optional)" value={item.gpa} onChange={v=>upd("gpa",v)} placeholder="e.g., 3.5" />
          </Grid>
          <Grid cols={2}>
            <Select label="Currently Enrolled?" required value={item.enrolled} onChange={v=>upd("enrolled",v)} options={["Yes","No"]} />
            <Select label="Graduated / Completed?" required value={item.graduated} onChange={v=>upd("graduated",v)} options={["Yes","No"]} />
          </Grid>
          <Grid cols={2}>
            <Input label="Honors / Awards (Optional)" value={item.honors} onChange={v=>upd("honors",v)} />
            <Input label="Relevant Coursework (Optional)" value={item.coursework} onChange={v=>upd("coursework",v)} />
          </Grid>
        </div>
      )}
    />
  </div>
);

const StepCertsSkills = ({ data, set }) => (
  <div>
    <SectionHeader icon="🏅" title="Certifications & Licenses" color="#F59E0B" subtitle="All optional. Add any professional certifications or credentials." />
    <Repeater items={data.certs||[]} setItems={c=>set({...data,certs:c})} empty={EMPTY_CERT} addLabel="Add Certification"
      renderItem={(item,i,upd) => (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Grid cols={2}><Input label="Name" value={item.name} onChange={v=>upd("name",v)} /><Input label="Issuing Organization" value={item.org} onChange={v=>upd("org",v)} /></Grid>
          <Grid cols={2}><Input label="Issue Date" type="month" value={item.issueDate} onChange={v=>upd("issueDate",v)} /><div><Input label="Expiration" type="month" value={item.expDate} onChange={v=>upd("expDate",v)} disabled={item.noExpire} /><div style={{marginTop:8}}><Checkbox label="Does Not Expire" checked={item.noExpire} onChange={v=>{upd("noExpire",v); if(v) upd("expDate","");}} /></div></div></Grid>
          <Grid cols={3}><Input label="License Number" value={item.number} onChange={v=>upd("number",v)} /><Select label="State Issued" value={item.stateIssued} onChange={v=>upd("stateIssued",v)} options={[{value:"N/A",label:"N/A"},...US_STATES.map(s=>({value:s,label:s}))]} /><Select label="Currently Active?" value={item.active} onChange={v=>upd("active",v)} options={["Yes","No"]} /></Grid>
        </div>
      )} />
    <div style={{ height:32 }} />
    <SectionHeader icon="⚙" title="Technical Skills" color={C.aqua} subtitle="Optional. Helps AI match you to relevant positions." />
    <Repeater items={data.skills||[]} setItems={s=>set({...data,skills:s})} empty={EMPTY_SKILL} addLabel="Add Skill"
      renderItem={(item,i,upd) => (
        <Grid cols={3}><Input label="Skill Name" value={item.name} onChange={v=>upd("name",v)} /><Select label="Proficiency" value={item.proficiency} onChange={v=>upd("proficiency",v)} options={["Beginner","Intermediate","Advanced","Expert"]} /><Input label="Years" value={item.years} onChange={v=>upd("years",v)} placeholder="e.g., 5" /></Grid>
      )} />
    <div style={{ height:32 }} />
    <SectionHeader icon="🌐" title="Languages" color={C.aqua} subtitle="Optional." />
    <Repeater items={data.languages||[]} setItems={l=>set({...data,languages:l})} empty={EMPTY_LANG} addLabel="Add Language"
      renderItem={(item,i,upd) => (
        <div><Input label="Language" value={item.name} onChange={v=>upd("name",v)} style={{marginBottom:12}} /><Grid cols={3}><Select label="Speaking" value={item.speaking} onChange={v=>upd("speaking",v)} options={["Basic","Conversational","Proficient","Fluent","Native"]} /><Select label="Reading" value={item.reading} onChange={v=>upd("reading",v)} options={["Basic","Conversational","Proficient","Fluent","Native"]} /><Select label="Writing" value={item.writing} onChange={v=>upd("writing",v)} options={["Basic","Conversational","Proficient","Fluent","Native"]} /></Grid></div>
      )} />
    <div style={{ height:32 }} />
    <SectionHeader icon="💻" title="Software & Tools" color={C.aqua} subtitle="Optional." />
    <Repeater items={data.software||[]} setItems={s=>set({...data,software:s})} empty={EMPTY_SW} addLabel="Add Software / Tool"
      renderItem={(item,i,upd) => (
        <Grid cols={2}><Input label="Name" value={item.name} onChange={v=>upd("name",v)} /><Select label="Proficiency" value={item.proficiency} onChange={v=>upd("proficiency",v)} options={["Beginner","Intermediate","Advanced","Expert"]} /></Grid>
      )} />
  </div>
);

const StepReferences = ({ data, set }) => (
  <div>
    <SectionHeader icon="📋" title="Professional References" color="#10B981" subtitle="Provide at least 3 professional references." />
    <Repeater items={data.refs||[{...EMPTY_REF},{...EMPTY_REF},{...EMPTY_REF}]} setItems={r=>set({...data,refs:r})} empty={EMPTY_REF} addLabel="Add Another Reference" min={3}
      renderItem={(item,i,upd) => (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Grid cols={3}><Input label="Full Name" required value={item.name} onChange={v=>upd("name",v)} /><Input label="Job Title" required value={item.title} onChange={v=>upd("title",v)} /><Input label="Company" required value={item.company} onChange={v=>upd("company",v)} /></Grid>
          <Grid cols={2}><Input label="Phone" required type="tel" value={item.phone} onChange={v=>upd("phone",v)} /><Input label="Email" required type="email" value={item.email} onChange={v=>upd("email",v)} /></Grid>
          <Grid cols={3}><Select label="Relationship" required value={item.relationship} onChange={v=>upd("relationship",v)} options={["Direct Manager/Supervisor","Senior Colleague","Peer/Colleague","Direct Report","Client/Customer","Mentor","Professor/Instructor","Business Partner"]} /><Input label="How Long Known" required value={item.howLong} onChange={v=>upd("howLong",v)} placeholder="e.g., 3 years" /><Select label="May Contact Before Offer? (Optional)" value={item.mayContact} onChange={v=>upd("mayContact",v)} options={["Yes","No"]} /></Grid>
        </div>
      )} />
  </div>
);

const StepPreferences = ({ data, set }) => {
  const u = f => v => set({ ...data, [f]:v });
  return (
    <div>
      <SectionHeader icon="🎯" title="Job Search Preferences" color={C.blue} subtitle="AI uses these to match you with the right opportunities." />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Target Roles</h4>
      <Grid cols={2}>
        <TextArea label="Target Job Titles" required value={data.targetTitles} onChange={u("targetTitles")} rows={2} placeholder="e.g., Senior Software Engineer, Tech Lead" hint="Comma-separated. AI will expand to include related and adjacent titles." />
        <TextArea label="Target Industries (Optional)" value={data.targetIndustries} onChange={u("targetIndustries")} rows={2} placeholder="e.g., Technology, Healthcare" hint="Comma-separated" />
      </Grid>
      <div style={{ height:16 }} />
      <MultiSelect label="Seniority Level" required value={data.seniority||[]} onChange={u("seniority")} options={["Entry Level","Mid Level","Senior","Lead","Manager","Director","VP","C-Level"]} hint="Select all that apply" />
      <div style={{ height:12 }} />
      <MultiSelect label="Employment Type" required value={data.empType||[]} onChange={u("empType")} options={["Full-Time","Part-Time","Contract","Temporary","Internship"]} hint="Select all that apply" />
      <div style={{ height:12 }} />
      <MultiSelect label="Work Arrangement" required value={data.workArrangement||[]} onChange={u("workArrangement")} options={["Remote","Hybrid","On-Site","No Preference"]} hint="Select all that apply" />
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Compensation</h4>
      <InfoBox color="rgba(47,109,246,0.06)" border="rgba(47,109,246,0.2)" textColor={C.slate}>
        AI calculates your salary maximum automatically (minimum + 15-20%). In salary-ban jurisdictions, AI enters N/A for current salary.
      </InfoBox>
      <div style={{ height:12 }} />
      <Grid cols={3}>
        <Input label="Desired Salary Minimum" required value={data.salaryMin} onChange={u("salaryMin")} placeholder="$85,000" />
        <Input label="Current Salary" required value={data.currentSalary} onChange={u("currentSalary")} placeholder="$75,000" hint="AI handles salary-ban states" />
        <Select label="Salary Type" required value={data.salaryType} onChange={u("salaryType")} options={["Annual","Hourly"]} />
      </Grid>
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Location & Availability</h4>
      <Grid cols={2}>
        <TextArea label="Target Locations" required value={data.targetLocations} onChange={u("targetLocations")} rows={2} placeholder="e.g., Austin TX, Remote, Bay Area" />
        <Input label="Max Commute Distance" required value={data.commute} onChange={u("commute")} placeholder="e.g., 30 miles" />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <YesNo label="Willing to Relocate?" required value={data.relocate} onChange={u("relocate")} />
        <Input label="Relocation Preferences (Optional)" value={data.relocPrefs} onChange={u("relocPrefs")} placeholder="e.g., Sun Belt states only" />
      </Grid>
      <div style={{ height:12 }} />
      <Input label="Earliest Start Date" required type="date" value={data.startDate} onChange={u("startDate")} style={{ maxWidth:420 }} />
      <div style={{ height:24 }} />
      <h4 style={{ fontSize:13,fontWeight:700,color:C.slate,textTransform:"uppercase",letterSpacing:1,marginBottom:12,fontFamily:"'Montserrat', sans-serif" }}>Schedule & Travel</h4>
      <Grid cols={2}>
        <YesNo label="Available for Shift Work?" required value={data.shiftWork} onChange={u("shiftWork")} />
        <YesNo label="Available for Weekends?" required value={data.weekends} onChange={u("weekends")} />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <YesNo label="Available for Overtime?" required value={data.overtime} onChange={u("overtime")} />
        <YesNo label="Willing to Travel?" required value={data.travel} onChange={u("travel")} />
      </Grid>
      {data.travel==="Yes" && <><div style={{ height:12 }} /><Select label="Travel Percentage" required value={data.travelPct} onChange={u("travelPct")} options={["Up to 10%","Up to 25%","Up to 50%","Up to 75%","Up to 100%"]} style={{maxWidth:300}} /></>}
    </div>
  );
};

const StepDisclosures = ({ data, set }) => {
  const u = f => v => set({ ...data, [f]:v });
  const allAgreed = data.certifyAccurate&&data.authBG&&data.authEmployment&&data.authEducation&&data.authReference&&data.authDrug&&data.atWill&&data.tos&&data.privacy&&data.aiConsent;
  return (
    <div>
      <SectionHeader icon="🔍" title="Criminal History" color="#F59E0B" subtitle="Answer honestly. AI checks ban-the-box rules by jurisdiction." />
      <InfoBox color="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.3)" textColor="#92400E">
        Answering "Yes" does not automatically disqualify you. Many employers evaluate candidates individually considering the nature of the offense, time elapsed, and rehabilitation.
      </InfoBox>
      <div style={{ height:16 }} />
      <Grid cols={2}>
        <YesNo label="Convicted of a felony?" required value={data.felony} onChange={u("felony")} />
        <YesNo label="Convicted of a misdemeanor?" required value={data.misdemeanor} onChange={u("misdemeanor")} />
      </Grid>
      {(data.felony==="Yes"||data.misdemeanor==="Yes") && <>
        <div style={{ height:12 }} />
        <TextArea label="Conviction Explanation" required value={data.convictionExpl} onChange={u("convictionExpl")} rows={3} placeholder="Include dates, charges, and disposition..." hint="Required if you answered Yes above" />
      </>}
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <YesNo label="Currently on probation/parole? (Optional)" value={data.probation} onChange={u("probation")} />
        <YesNo label="Pending criminal charges? (Optional)" value={data.pendingCharges} onChange={u("pendingCharges")} />
      </Grid>
      <div style={{ height:32 }} />
      <SectionHeader icon="📜" title="Disclosures" color="#8B5CF6" />
      <Grid cols={2}>
        <YesNo label="Subject to non-compete agreements?" required value={data.nonCompete} onChange={u("nonCompete")} hint="FTC status checked at application time" />
        <YesNo label="Subject to confidentiality agreements?" required value={data.confidentiality} onChange={u("confidentiality")} />
      </Grid>
      <div style={{ height:12 }} />
      <YesNo label="Ever been terminated from a job?" required value={data.terminated} onChange={u("terminated")} style={{maxWidth:500}} />
      {data.terminated==="Yes" && <>
        <div style={{ height:12 }} />
        <TextArea label="Termination Explanation" required value={data.terminationExpl} onChange={u("terminationExpl")} rows={3} />
      </>}
      <div style={{ height:32 }} />
      <SectionHeader icon="🌍" title="EEO Information (Voluntary)" color={C.gray} subtitle="Confidential. Used for EEOC compliance only. Will not affect your application." />
      <Grid cols={2}>
        <Select label="Gender (Optional)" value={data.gender} onChange={u("gender")} options={["Male","Female","Non-Binary","Prefer Not to Say"]} />
        <Select label="Race / Ethnicity (Optional)" value={data.race} onChange={u("race")} options={["American Indian or Alaska Native","Asian","Black or African American","Hispanic or Latino","Native Hawaiian or Other Pacific Islander","White","Two or More Races","Prefer Not to Say"]} />
      </Grid>
      <div style={{ height:12 }} />
      <Grid cols={2}>
        <Select label="Veteran Status (Optional)" value={data.veteran} onChange={u("veteran")} options={["I am a veteran","I am not a veteran","Prefer Not to Say"]} />
        <Select label="Disability Status (Optional)" value={data.disability} onChange={u("disability")} options={["Yes, I have a disability","No, I do not have a disability","Prefer Not to Say"]} />
      </Grid>
      <div style={{ height:32 }} />
      <SectionHeader icon="✍" title="Authorizations & Agreements" color="#EF4444" subtitle="All required. Check each box to authorize." />
      <InfoBox color="rgba(239,68,68,0.06)" border="rgba(239,68,68,0.2)" textColor="#991B1B">
        By checking these boxes, you are providing legally binding electronic consent. Your full legal name and today's date are captured as your digital signature.
      </InfoBox>
      <div style={{ height:16 }} />
      {[
        { key:"certifyAccurate", text:"I certify that all information provided is true, complete, and accurate. I understand that any falsification may result in disqualification or termination." },
        { key:"authBG", text:"I authorize a background investigation, including criminal history, employment verification, and education verification." },
        { key:"authEmployment", text:"I authorize previous employers to release information regarding my employment history." },
        { key:"authEducation", text:"I authorize educational institutions to release my academic records for verification." },
        { key:"authReference", text:"I authorize my references to be contacted and to share their assessment of my qualifications." },
        { key:"authDrug", text:"I agree to submit to drug testing as a condition of employment, where required and permitted by law." },
        { key:"atWill", text:"I understand that if hired, my employment will be at-will, meaning either party may terminate the relationship at any time." },
        { key:"tos", text:"I agree to the Talendro Terms of Service, including the use of AI technology to optimize and submit applications on my behalf." },
        { key:"privacy", text:"I agree to the Talendro Privacy Policy and consent to the collection and processing of my personal data." },
        { key:"aiConsent", text:"I understand that Talendro will use AI to match my profile with job opportunities and submit applications to positions meeting my stated preferences." },
      ].map(a => (
        <div key={a.key} style={{ padding:"14px 16px",borderRadius:10,border:`1.5px solid ${data[a.key]?"#10B981":C.redBorder}`,background:data[a.key]?"rgba(16,185,129,0.04)":C.redBg,marginBottom:10,transition:"all 0.3s" }}>
          <Checkbox label={a.text} checked={data[a.key]} onChange={v => u(a.key)(v)} />
        </div>
      ))}
      <button type="button" onClick={() => {
        const upd={};
        ["certifyAccurate","authBG","authEmployment","authEducation","authReference","authDrug","atWill","tos","privacy","aiConsent"].forEach(k => upd[k]=!allAgreed);
        set({...data,...upd});
      }} style={{ marginTop:8,padding:"10px 24px",border:`1.5px solid ${C.blue}`,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",background:allAgreed?C.blue:C.white,color:allAgreed?C.white:C.blue,fontFamily:"'Inter', sans-serif" }}>
        {allAgreed?"Uncheck All":"Check All Agreements"}
      </button>
      <div style={{ height:32 }} />
      <SectionHeader icon="📄" title="Document Uploads (Optional)" color={C.blue} subtitle="Supporting documents. AI generates optimized resumes per application from your Step 1 upload." />
      {[
        { key:"portfolio", label:"Portfolio / Work Samples (Optional)" },
        { key:"transcripts", label:"Transcripts (Optional)" },
        { key:"certDocs", label:"Certification Documents (Optional)" },
        { key:"refLetters", label:"Letters of Recommendation (Optional)" },
        { key:"dd214", label:"DD-214 / Veterans (Optional)" },
      ].map(doc => (
        <div key={doc.key} style={{ marginBottom:12 }}>
          <Label>{doc.label}</Label>
          <div style={{ border:`2px dashed ${data[doc.key]?"#10B981":"#d1d5db"}`,borderRadius:10,padding:20,textAlign:"center",background:data[doc.key]?"rgba(16,185,129,0.04)":C.lightBg,cursor:"pointer" }}>
            <input type="file" id={`file-${doc.key}`} style={{ display:"none" }} onChange={e => u(doc.key)(e.target.files[0]?.name||"")} />
            <label htmlFor={`file-${doc.key}`} style={{ cursor:"pointer",fontSize:14,color:data[doc.key]?"#10B981":C.gray }}>
              {data[doc.key]?`✓ ${data[doc.key]}`:`Click to upload ${doc.label.replace(" (Optional)","")}`}
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

const StepReview = ({ formData, setStep }) => {
  const sections = [
    { label:"Resume Upload", step:0, check:() => !!formData.s0?.resume || !!localStorage.getItem('resumeParsed') },
    { label:"Personal Information", step:1, check:() => {
      const d=formData.s1||{};
      return !!(d.firstName&&d.lastName&&d.email&&d.phone&&d.dob&&d.ssn4&&(d.dlNumber||d.dlNumber==="N/A"));
    }},
    { label:"Work Authorization", step:2, check:() => {
      const d=formData.s2||{};
      return !!(d.workAuth&&d.usCitizen&&d.sponsorNow&&d.sponsorFuture&&d.over18&&d.bgCheck&&d.emergName&&d.emergPhone);
    }},
    { label:"Employment History", step:3, check:() => {
      const entries=formData.s3?.entries||[];
      return entries.some(e => e.type==="gap"?(e.category&&e.startDate):(e.company&&e.title&&e.startDate&&e.city&&e.state&&e.duties));
    }},
    { label:"Address History", step:4, check:() => {
      const c=formData.s4?.current||{};
      return !!(c.street&&c.city&&c.county&&c.state&&c.zip&&c.moveIn);
    }},
    { label:"Education", step:5, check:() => {
      const schools=formData.s5?.schools||[];
      return schools.some(s => s.institution&&s.degreeType&&s.major);
    }},
    { label:"Certs & Skills", step:6, check:() => true },
    { label:"References", step:7, check:() => {
      const refs=formData.s7?.refs||[];
      return refs.filter(r => r.name&&r.title&&r.company&&r.phone&&r.email&&r.relationship).length>=3;
    }},
    { label:"Job Preferences", step:8, check:() => {
      const d=formData.s8||{};
      return !!(d.targetTitles&&(d.seniority||[]).length>0&&(d.empType||[]).length>0&&(d.workArrangement||[]).length>0&&d.salaryMin&&d.salaryType&&d.startDate);
    }},
    { label:"Disclosures & Agreements", step:9, check:() => {
      const d=formData.s9||{};
      return !!(d.felony&&d.misdemeanor&&d.nonCompete&&d.confidentiality&&d.terminated&&d.certifyAccurate&&d.authBG&&d.authEmployment&&d.authEducation&&d.authReference&&d.authDrug&&d.atWill&&d.tos&&d.privacy&&d.aiConsent);
    }},
  ];
  const complete = sections.filter(s => s.check()).length;
  return (
    <div>
      <SectionHeader icon="✅" title="Review & Submit" color="#10B981" subtitle="Verify all sections are complete before launching your job search." />
      <div style={{ padding:20,background:C.lightBg,borderRadius:12,border:"1px solid #e5e7eb",marginBottom:24 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
          <span style={{ fontSize:14,fontWeight:700,color:C.slate,fontFamily:"'Montserrat', sans-serif" }}>Overall Completion</span>
          <span style={{ fontSize:14,fontWeight:700,color:complete===sections.length?"#10B981":C.blue }}>{Math.round((complete/sections.length)*100)}%</span>
        </div>
        <div style={{ height:10,background:"#e5e7eb",borderRadius:5,overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${(complete/sections.length)*100}%`,background:complete===sections.length?"#10B981":C.blue,borderRadius:5,transition:"width 0.5s" }} />
        </div>
      </div>
      {sections.map((s,i) => {
        const ok = s.check();
        return (
          <div key={i} onClick={() => setStep(s.step)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:10,border:`1.5px solid ${ok?"#10B981":"#e5e7eb"}`,background:ok?"rgba(16,185,129,0.04)":C.white,marginBottom:8,cursor:"pointer",transition:"all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.06)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
            <span style={{ fontSize:14,fontWeight:600,color:C.slate,fontFamily:"'Inter', sans-serif" }}>
              {ok?"✅":"⬜"} {s.label}
            </span>
            <span style={{ fontSize:12,fontWeight:600,color:ok?"#10B981":C.gray }}>{ok?"Complete":"Incomplete — Click to edit"}</span>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
//  MAIN ONBOARDING COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    s0: {},
    s1: { suffix: 'N/A' },
    s2: { visaType: 'N/A' },
    s3: { entries: [{ ...EMPTY_JOB }] },
    s4: { current: { ...EMPTY_ADDR, isCurrent:true }, history:[] },
    s5: { schools: [{ ...EMPTY_EDU }] },
    s6: { certs:[], skills:[], languages:[], software:[] },
    s7: { refs: [{...EMPTY_REF},{...EMPTY_REF},{...EMPTY_REF}] },
    s8: {},
    s9: {},
  });
  const [submitted, setSubmitted] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    contentRef.current?.scrollTo({ top:0, behavior:"smooth" });
    window.scrollTo({ top:0, behavior:"smooth" });
  }, [step]);

  // Bridge: if user came from the new ResumeUpload flow, pre-populate and skip step 0
  useEffect(() => {
    const resumeParsed = localStorage.getItem('resumeParsed');
    const raw = localStorage.getItem('resumeData');
    if (!resumeParsed || !raw) return;
    try {
      const rd = JSON.parse(raw);
      const prefill = rd?.prefill || {};
      const profileDraft = rd?.profileDraft || {};
      const basics = profileDraft?.basics || {};
      const work = Array.isArray(profileDraft?.work) ? profileDraft.work : [];
      const edu = Array.isArray(profileDraft?.education) ? profileDraft.education : [];
      const skills = Array.isArray(profileDraft?.skills) ? profileDraft.skills : [];
      const step1 = prefill?.step1 || {};
      const names = (step1.fullLegalName || basics.name || '').split(' ').filter(Boolean);

      // Map to s1 (Personal)
      const s1 = {
        firstName: step1.firstName || names[0] || '',
        lastName: step1.lastName || names.slice(1).join(' ') || '',
        email: step1.email || basics.email || '',
        phone: step1.phone || basics.phone || '',
        linkedin: step1.linkedinUrl || basics.linkedin || '',
      };

      // Map to s3 (Employment) — use profileDraft.work for richer data
      const jobEntries = work.length > 0
        ? work.map(job => ({
            ...EMPTY_JOB,
            company: job.companyName || job.company || job.name || '',
            title: job.jobTitle || job.title || job.position || '',
            startDate: (job.startDate || '').slice(0, 7),
            endDate: job.current ? '' : (job.endDate || '').slice(0, 7),
            currentlyHere: !!job.current,
            city: (job.location || '').split(',')[0]?.trim() || '',
            state: (job.location || '').split(',')[1]?.trim() || '',
            duties: job.description || job.summary || '',
          }))
        : [{ ...EMPTY_JOB }];

      // Map to s5 (Education)
      const eduEntries = edu.length > 0
        ? edu.map(e => ({
            ...EMPTY_EDU,
            institution: e.institutionName || e.institution || '',
            degreeType: e.highestDegree || e.degree || e.studyType || '',
            major: e.majorFieldOfStudy || e.major || e.area || '',
            endDate: (e.graduationDate || '').slice(0, 7),
            gpa: e.gpa || '',
          }))
        : [{ ...EMPTY_EDU }];

      // Map to s6 (Certs & Skills)
      const skillEntries = skills.map(s =>
        typeof s === 'string' ? { ...EMPTY_SKILL, name: s } : { ...EMPTY_SKILL, ...s }
      );

      // Build suggested target job titles from current job title + top work titles
      const currentTitle = basics.currentJobTitle || (work[0]?.jobTitle) || (work[0]?.title) || '';
      const relatedTitles = work.slice(0, 3).map(j => j.jobTitle || j.title || '').filter(Boolean);
      const uniqueTitles = [...new Set([currentTitle, ...relatedTitles])].filter(Boolean);
      const suggestedTargetTitles = uniqueTitles.join(', ');

      // Infer seniority from job titles
      const titleText = suggestedTargetTitles.toLowerCase();
      const seniority = [];
      if (titleText.match(/\bceo\b|\bcoo\b|\bcto\b|\bcfo\b|\bc-level\b|\bchief\b|\bpresident\b/)) seniority.push('C-Level');
      if (titleText.match(/\bvp\b|\bvice president\b/)) seniority.push('VP');
      if (titleText.match(/\bdirector\b/)) seniority.push('Director');
      if (titleText.match(/\bmanager\b|\bmanaging\b/)) seniority.push('Manager');
      if (titleText.match(/\blead\b|\bprincipal\b/)) seniority.push('Lead');
      if (titleText.match(/\bsenior\b|\bsr\.?\b/)) seniority.push('Senior');
      if (seniority.length === 0) seniority.push('Mid Level');

      handleResumeParsed({
        s1,
        s2: { visaType: 'N/A' },
        s3: { entries: jobEntries },
        s5: { schools: eduEntries },
        s6: { skills: skillEntries, certs: [], languages: [], software: [] },
        s8: {
          targetTitles: suggestedTargetTitles,
          seniority,
          empType: ['Full-Time'],
          workArrangement: ['No Preference'],
          salaryType: 'Annual',
        },
      });

      // Skip step 0 (resume upload) since resume is already processed
      setStep(1);
    } catch (e) {
      console.warn('Could not pre-populate from resumeData:', e);
    }
  }, []); // intentionally empty deps — runs once on mount

  const setSD = k => d => setFormData(p => ({ ...p, [k]:d }));
  const progress = ((step+1)/STEPS.length)*100;

  // Save progress to MongoDB (fire-and-forget)
  const saveProgress = async (nextStep, currentFormData) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      await fetch('/api/auth/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ step: nextStep, formData: currentFormData }),
      });
    } catch (e) {
      console.warn('[Onboarding] Failed to save progress:', e);
    }
  };

  // Advance to next step and save progress
  const goToStep = (nextStep) => {
    setStep(nextStep);
    saveProgress(nextStep, formData);
  };

  const handleResumeParsed = useCallback((parsedData) => {
    setFormData(prev => {
      const merged = { ...prev };
      Object.keys(parsedData).forEach(key => {
        if (typeof parsedData[key]==="object"&&parsedData[key]!==null) {
          merged[key] = { ...prev[key], ...parsedData[key] };
          if (parsedData[key].entries?.length)   merged[key].entries   = parsedData[key].entries;
          if (parsedData[key].schools?.length)   merged[key].schools   = parsedData[key].schools;
          if (parsedData[key].refs?.length)      merged[key].refs      = parsedData[key].refs;
          if (parsedData[key].certs)             merged[key].certs     = parsedData[key].certs;
          if (parsedData[key].skills?.length)    merged[key].skills    = parsedData[key].skills;
          if (parsedData[key].languages)         merged[key].languages = parsedData[key].languages;
          if (parsedData[key].software?.length)  merged[key].software  = parsedData[key].software;
          if (parsedData[key].current)           merged[key].current   = parsedData[key].current;
          if (parsedData[key].history)           merged[key].history   = parsedData[key].history;
        }
      });
      return merged;
    });
  }, []);

  const handleComplete = async () => {
    // Save profile to localStorage for backend pickup
    localStorage.setItem("talendro_profile", JSON.stringify(formData));
    // Save final completed state to MongoDB
    await saveProgress(STEPS.length, formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.lightBg,fontFamily:"'Montserrat', sans-serif",padding:20 }}>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign:"center",maxWidth:600 }}>
          <div style={{ fontSize:80,marginBottom:24 }}>🎯</div>
          <h1 style={{ fontSize:36,fontWeight:800,color:C.blue,fontFamily:"'Montserrat', sans-serif",marginBottom:12 }}>Profile Complete</h1>
          <p style={{ fontSize:18,color:C.gray,marginBottom:32 }}>Your profile is locked and loaded. AI is ready to start applying to jobs on your behalf.</p>
          <div style={{ background:"#F0FDF4",borderRadius:16,padding:32,border:"1px solid #D1FAE5",marginBottom:32 }}>
            <p style={{ color:"#10B981",fontWeight:700,fontSize:16 }}>24 additional fields are handled by AI at application time</p>
            <p style={{ color:C.gray,fontSize:14,marginTop:8 }}>Cover letters, company research, gap explanations, and custom employer questions — all generated automatically.</p>
          </div>
          <div style={{ display:"flex",gap:16,justifyContent:"center" }}>
            <button onClick={() => { setSubmitted(false); setStep(10); }}
              style={{ padding:"14px 32px",border:"1.5px solid #E5E7EB",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",background:C.white,color:C.slate,fontFamily:"'Inter', sans-serif" }}>
              ← Review & Edit
            </button>
            <button onClick={() => navigate("/app/dashboard")}
              style={{ padding:"14px 40px",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",background:C.blue,color:C.white,fontFamily:"'Inter', sans-serif",boxShadow:"0 4px 16px rgba(47,109,246,0.4)" }}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepMap = [
    <StepResume      data={formData.s0} set={setSD("s0")} onParsed={handleResumeParsed} />,
    <StepPersonal    data={formData.s1} set={setSD("s1")} />,
    <StepWorkAuth    data={formData.s2} set={setSD("s2")} />,
    <StepEmployment  data={formData.s3} set={setSD("s3")} />,
    <StepAddresses   data={formData.s4} set={setSD("s4")} />,
    <StepEducation   data={formData.s5} set={setSD("s5")} />,
    <StepCertsSkills data={formData.s6} set={setSD("s6")} />,
    <StepReferences  data={formData.s7} set={setSD("s7")} />,
    <StepPreferences data={formData.s8} set={setSD("s8")} />,
    <StepDisclosures data={formData.s9} set={setSD("s9")} />,
    <StepReview      formData={formData} setStep={setStep} />,
  ];

  return (
    <div style={{ minHeight:"100vh",display:"flex",flexDirection:"column",background:C.lightBg,fontFamily:"'Inter', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ background:C.white,borderBottom:"1px solid #e5e7eb",padding:"16px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0 }}>
        <div>
          <h1 style={{ margin:0,fontSize:22,fontWeight:800,color:C.blue,fontFamily:"'Montserrat', sans-serif",letterSpacing:-0.5 }}>
            Talendro<span style={{ color:C.aqua }}>™</span> <span style={{ fontSize:14,fontWeight:600,color:C.gray }}>Apply</span>
          </h1>
          <p style={{ margin:0,fontSize:12,color:C.gray,letterSpacing:1 }}>AUTONOMOUS JOB APPLICATION PLATFORM</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <p style={{ margin:0,fontSize:13,color:C.gray }}>Complete Your Profile</p>
          <p style={{ margin:0,fontSize:18,fontWeight:700,color:C.slate,fontFamily:"'Montserrat', sans-serif" }}>{Math.round(progress)}%</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ height:4,background:"#e5e7eb",flexShrink:0 }}>
        <div style={{ height:"100%",background:`linear-gradient(90deg, ${C.blue}, ${C.aqua})`,width:`${progress}%`,transition:"width 0.5s ease" }} />
      </div>

      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
        {/* Step Nav */}
        <nav style={{ width:200,background:C.white,borderRight:"1px solid #e5e7eb",padding:"16px 0",overflowY:"auto",flexShrink:0 }}>
          {STEPS.map((s,i) => (
            <button key={s.id} onClick={() => goToStep(i)}
              style={{ display:"block",width:"100%",padding:"10px 20px",border:"none",cursor:"pointer",fontSize:13,fontWeight:step===i?700:400,background:step===i?"rgba(47,109,246,0.06)":"transparent",color:step===i?C.blue:C.gray,borderLeft:step===i?`3px solid ${C.blue}`:"3px solid transparent",fontFamily:"'Inter', sans-serif",textAlign:"left",transition:"all 0.15s" }}>
              {i+1}. {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main ref={contentRef} style={{ flex:1,overflowY:"auto",padding:"32px 48px 120px" }}>
          <div style={{ maxWidth:860,margin:"0 auto" }}>
            {stepMap[step]}
          </div>
        </main>
      </div>

      {/* Footer Nav */}
      <footer style={{ background:C.white,borderTop:"1px solid #e5e7eb",padding:"14px 48px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
        <button onClick={() => step>0&&goToStep(step-1)} disabled={step===0}
          style={{ padding:"10px 28px",border:"1.5px solid #e5e7eb",borderRadius:8,fontSize:14,fontWeight:600,cursor:step===0?"not-allowed":"pointer",background:C.white,color:step===0?"#d1d5db":C.slate,fontFamily:"'Inter', sans-serif",opacity:step===0?0.5:1 }}>
          ← Back
        </button>
        <span style={{ fontSize:13,color:C.gray }}>Step {step+1} of {STEPS.length}</span>
        {step<STEPS.length-1 ? (
          <button onClick={() => goToStep(step+1)}
            style={{ padding:"10px 28px",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",background:C.blue,color:C.white,fontFamily:"'Inter', sans-serif",boxShadow:"0 2px 8px rgba(47,109,246,0.3)" }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleComplete}
            style={{ padding:"10px 36px",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",background:"#10B981",color:C.white,fontFamily:"'Inter', sans-serif",boxShadow:"0 2px 8px rgba(16,185,129,0.3)" }}>
            ✓ Complete Profile & Launch Job Search
          </button>
        )}
      </footer>
    </div>
  );
}
