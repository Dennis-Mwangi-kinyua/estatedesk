import { ImageResponse } from "next/og";
export const alt = "EstateDesk — property management software for Kenya";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"80px",background:"#0b172b",color:"#ffffff"}}><div style={{display:"flex",fontSize:30,color:"#8bc8ff",marginBottom:34}}>EstateDesk</div><div style={{display:"flex",fontSize:66,fontWeight:700,lineHeight:1.1,maxWidth:1000}}>Your properties. One clear workspace.</div><div style={{display:"flex",fontSize:27,color:"#c5d5e8",marginTop:34}}>Tenants · Leases · M-Pesa · Water bills · Accounting</div><div style={{display:"flex",fontSize:24,color:"#8be3b6",marginTop:50}}>Built for property managers and landlords in Kenya</div></div>, size);
}
