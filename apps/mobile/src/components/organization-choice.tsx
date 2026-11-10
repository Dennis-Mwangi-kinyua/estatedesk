import { useRef, useState } from "react";
import { Text, View } from "react-native";
import type { NativeActionField } from "@estatedesk/contracts/mobile";
import { getNativeWorkspace } from "../api";
import { Button, Field, styles } from "./ui";

export function OrganizationChoice({field,value,change,disabled}:{field:NativeActionField;value:string;change:(value:string)=>void;disabled:boolean}) {
  const [query,setQuery]=useState("");
  const [choices,setChoices]=useState(field.options??[]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const request=useRef(0);
  async function search(){
    const current=++request.current;setBusy(true);setMessage("");
    try {
      const result=await getNativeWorkspace("platform","/platform/crm/customers",query.trim(),1);
      if(current!==request.current)return;
      setChoices(previous=>[...new Map([...previous.filter(o=>o.value===value),...result.records.map(r=>({value:r.id.replace(/^organization:/,""),label:r.title}))].map(o=>[o.value,o])).values()]);
      setMessage(result.records.length?"Choose the customer organization below. Narrow your search if needed.":"No matching organizations.");
    }catch{if(current===request.current)setMessage("Unable to search customers. Try again.");}
    finally{if(current===request.current)setBusy(false);}
  }
  return <View style={{gap:10}}><Text style={styles.label}>{field.label}</Text><Text style={styles.subtitle}>{choices.find(o=>o.value===value)?.label??"No linked customer"}</Text><Field label="Find organization by name or email" value={query} onChangeText={setQuery} editable={!disabled&&!busy} maxLength={100} autoCorrect={false}/><Button label={busy?"Searching…":"Search organizations"} onPress={()=>void search()} disabled={disabled||busy||query.trim().length<2}/><Button label="No linked customer" checked={!value} secondary disabled={disabled||busy} onPress={()=>change("")}/>{choices.map(o=><Button key={o.value} label={o.label} checked={value===o.value} secondary disabled={disabled||busy} onPress={()=>change(o.value)}/>)}{message?<Text accessibilityLiveRegion="polite" style={styles.subtitle}>{message}</Text>:null}</View>;
}
