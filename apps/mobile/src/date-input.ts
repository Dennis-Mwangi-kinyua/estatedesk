export type DateParts = { day:string; month:string; year:string; hour:string; minute:string };
const empty:DateParts={day:"",month:"",year:"",hour:"",minute:""};
export function dateParts(value:string,datetime:boolean):DateParts {
  if(value.startsWith("draft-date:")){const [year="",month="",day="",hour="",minute=""]=value.slice(11).split("|");return {year,month,day,hour,minute};}
  if(!value)return {...empty};
  if(!datetime&&/^\d{4}-\d{2}-\d{2}$/.test(value)){const [year,month,day]=value.split("-");return {year,month,day,hour:"",minute:""};}
  const parsed=new Date(value);if(!Number.isFinite(parsed.getTime()))return {...empty};
  const local=new Date(parsed.getTime()+3*3600000),iso=local.toISOString();
  return {year:iso.slice(0,4),month:iso.slice(5,7),day:iso.slice(8,10),hour:iso.slice(11,13),minute:iso.slice(14,16)};
}
export function datePartsValue(parts:DateParts,datetime:boolean):string {
  const {year,month,day,hour,minute}=parts;
  if(Object.values(parts).every(v=>!v))return "";
  const y=Number(year),m=Number(month),d=Number(day),h=Number(hour),min=Number(minute);
  const valid=year.length===4&&y>=1900&&y<=9999&&month.length>0&&day.length>0&&m>=1&&m<=12&&d>=1&&d<=31&&(!datetime||(hour!==""&&minute!==""&&h>=0&&h<=23&&min>=0&&min<=59));
  const calendar=new Date(Date.UTC(y,m-1,d));
  if(valid&&calendar.getUTCFullYear()===y&&calendar.getUTCMonth()===m-1&&calendar.getUTCDate()===d){
    if(datetime)return new Date(Date.UTC(y,m-1,d,h-3,min)).toISOString();
    return `${year}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  }
  return `draft-date:${[year,month,day,hour,minute].join("|")}`;
}
