import { useState } from "react";
import { Image, Text, View } from "react-native";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { pickPhoto, removePickedPhoto } from "../photos";
import { Button, styles } from "./ui";
export function ListingPhotoField({label,value,change,disabled}:{label:string;value:string;change:(value:string)=>void;disabled:boolean}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function choose(camera:boolean){setBusy(true);setError("");try{const photo=await pickPhoto(camera);if(!photo)return;try{const context=ImageManipulator.manipulate(photo.uri);context.resize({width:1000});try{const image=await context.renderAsync();try{const result=await image.saveAsync({format:SaveFormat.JPEG,compress:0.45});const file=new File(result.uri);try{if(file.size>250000)throw new Error("Choose a simpler or smaller photo (under 250 KB after resizing).");change(`data:image/jpeg;base64,${await file.base64()}`);}finally{if(file.exists)file.delete();}}finally{image.release();}}finally{context.release();}}finally{removePickedPhoto(photo);}}catch(e){setError(e instanceof Error?e.message:"Could not select photo.");}finally{setBusy(false);}}
 return <View style={{gap:10}}><Text style={styles.label}>{label}</Text>{value?<><Image source={{uri:value}} accessibilityLabel="Selected listing photo" style={{height:180,width:"100%",borderRadius:12}} resizeMode="contain"/><Button label="Remove selected photo" secondary disabled={disabled||busy} onPress={()=>change("")}/></>:null}<Button label="Take listing photo" secondary disabled={disabled||busy} onPress={()=>void choose(true)}/><Button label="Choose listing photo" secondary disabled={disabled||busy} onPress={()=>void choose(false)}/>{error?<Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}</View>;
}
