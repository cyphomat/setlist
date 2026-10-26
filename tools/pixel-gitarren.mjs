// Zehn Gitarren fuers Rack, als Pixelbogen gebaut von tools/pixel.mjs.
//
// Eigene, generische Formen — keine Marken- und keine Modellnamen. Der Koerper
// ist eine Maske aus Zeilen-Segmenten, die Kopfplatte ein Zeichenraster; Kontur,
// Licht und Schatten ergeben sich aus der Maske und aus der Grundfarbe.
// Der Code stammt aus der Gitarrenwerkstatt in Roadie (eigene Seite des Autors)
// und ist hier ohne Canvas umgesetzt: statt einer Zeichenflaeche ein Pixelfeld.
//
// Jedes Bild ist 24 x 56 und steht am unteren Rand, damit die Gitarren im Rack
// auf einer Linie haengen, egal wie lang sie sind. Die Reihenfolge ist die
// von GITARREN in js/gitarren.js; pixel.mjs prueft das.

export const GITARREN = [
  {id:"brett",   form:"dcut",    kopf:"inline", farbe:"#ece0c4", akz:"#f2efe6", guard:"#6b2f22"},
  {id:"keller",  form:"scut",    kopf:"zwei",   farbe:"#c8641e", akz:"#efe2c0", burst:1},
  {id:"offset",  form:"offset",  kopf:"inline", farbe:"#86cbb8", akz:"#f2efe6", guard:"#3a2a22"},
  {id:"falke",   form:"vee",     kopf:"spitz",  farbe:"#1b1b1e", akz:"#c0282d"},
  {id:"zacke",   form:"etype",   kopf:"spitz",  farbe:"#e9ecef", akz:"#18181b"},
  {id:"stern",   form:"star",    kopf:"spitz",  farbe:"#a7b0b8", akz:"#2b3138"},
  {id:"siegel",  form:"dcut",    kopf:"inline", farbe:"#4b2a6b", akz:"#d9c27a", saiten:7},
  {id:"hohl",    form:"hollow",  kopf:"zwei",   farbe:"#9a5426", akz:"#f0dcae", burst:1},
  {id:"kopflos", form:"headless",kopf:"keiner", farbe:"#8fd12a", akz:"#141414", saiten:8},
  {id:"axt",     form:"scut",    kopf:"zwei",   farbe:"#d6a92e", akz:"#2c2108"}
];

const R=(n,seg)=>Array.from({length:n},()=>seg);
const SP={
  dcut:{rows:[[[5,6],[16,17]],[[4,7],[16,18]],[[4,8],[15,18]],[[3,9],[14,19]],...R(3,[[3,20]]),...R(2,[[4,19]]),...R(3,[[5,18]]),[[4,19]],[[3,20]],[[2,21]],...R(7,[[1,22]]),...R(2,[[2,21]]),[[3,20]],[[4,19]],[[6,17]],[[9,14]]],
    neckIn:6, pu:[12,17], bridge:21, knobs:[[17,22],[18,24],[15,25]],
    guard:[[8,[7,16]],...Array.from({length:12},(_,k)=>[9+k,[6,17]]),[21,[7,16]],[22,[8,15]]]},
  scut:{rows:[[[16,17]],[[15,18]],[[7,9],[14,19]],[[5,9],[14,19]],[[4,19]],...R(3,[[3,20]]),...R(3,[[4,19]]),[[3,20]],...R(2,[[2,21]]),...R(8,[[1,22]]),...R(2,[[2,21]]),[[3,20]],[[4,19]],[[6,17]],[[9,14]]],
    neckIn:5, pu:[11,16], bridge:20, knobs:[[17,21],[18,23],[15,24]]},
  offset:{rows:[[[4,5]],[[3,6]],[[3,7],[17,18]],[[3,8],[16,19]],[[3,9],[15,19]],[[3,20]],...R(2,[[4,20]]),...R(2,[[5,19]]),[[5,18]],[[4,18]],[[3,19]],[[2,20]],[[1,21]],...R(6,[[1,22]]),...R(2,[[1,21]]),[[2,20]],[[3,19]],[[5,18]],[[8,15]]],
    neckIn:6, pu:[12,17], bridge:21, knobs:[[17,22],[18,24],[15,25]],
    guard:[...Array.from({length:8},(_,k)=>[6+k,[k<2?6:7,9]]),[14,[5,9]],[15,[4,9]],[16,[4,9]],[17,[5,9]],[18,[6,9]]]},
  vee:{rows:[...R(2,[[9,14]]),...R(2,[[8,15]]),...R(2,[[7,16]]),...R(2,[[6,17]]),...R(3,[[5,18]]),...R(2,[[4,19]]),[[4,10],[13,19]],...R(2,[[3,9],[14,20]]),[[3,8],[15,20]],[[2,8],[15,21]],...R(2,[[2,7],[16,21]]),...R(2,[[1,6],[17,22]]),...R(2,[[1,5],[18,22]]),[[2,4],[19,21]]],
    neckIn:3, pu:[5,9], bridge:12, knobs:[[16,16],[17,18]]},
  etype:{rows:[[[19,20]],[[18,21]],[[17,21]],[[7,9],[16,21]],[[6,20]],[[5,20]],[[5,19]],[[4,19]],...R(2,[[4,18]]),[[3,18]],[[3,19]],[[3,20]],[[2,21]],...R(2,[[2,22]]),[[1,21]],[[1,19]],[[1,16]],[[0,13]],[[0,10]],[[0,7]],[[0,4]]],
    neckIn:4, pu:[6,10], bridge:14, knobs:[[18,16],[17,17]]},
  star:{rows:[[[9,14]],[[9,14],[19,20]],[[2,3],[9,14],[18,20]],[[2,4],[8,15],[17,20]],[[3,19]],[[4,19]],[[5,18]],...R(3,[[6,17]]),[[5,18]],[[4,19]],[[3,20]],[[2,10],[13,21]],[[1,9],[14,22]],[[1,7],[10,13],[16,22]],[[0,5],[10,13],[18,23]],[[0,3],[11,12],[20,23]],[[11,12]]],
    neckIn:3, pu:[4,8], bridge:11, knobs:[[15,12],[16,13]]},
  hollow:{rows:[[[6,8],[15,17]],[[4,9],[14,19]],[[3,20]],...R(2,[[2,21]]),...R(3,[[1,22]]),...R(2,[[2,21]]),...R(2,[[3,20]]),[[2,21]],[[1,22]],...R(8,[[0,23]]),...R(2,[[1,22]]),[[2,21]],[[3,20]],[[5,18]],[[8,15]]],
    neckIn:5, pu:[8,13], bridge:19, knobs:[[18,21],[19,23],[16,24]],
    fholes:[[4,13],[4,14],[5,15],[5,16],[4,17],[4,18],[19,13],[19,14],[18,15],[18,16],[19,17],[19,18]]},
  headless:{rows:[[[6,8],[15,17]],[[5,9],[14,18]],[[5,18]],...R(2,[[4,19]]),...R(2,[[5,18]]),[[4,19]],...R(6,[[3,20]]),[[4,19]],[[5,18]],[[7,16]]],
    neckIn:4, pu:[5], bridge:12, knobs:[[16,10]]}
};
const HEADS={
  inline:["............OOO.........","...........OHBBO........","..........OHBBO.........",".........MOHBO..........","..........OHBO..........",".........MOHBO..........","..........OHBO..........",".........MOHBO..........","..........OBBO..........","..........OWWO.........."],
  zwei:  ["..........OOOO..........",".........OHBBSO.........","........MOHBBSOM........",".........OHBBSO.........","........MOHBBSOM........",".........OHBBSO.........","........MOHBBSOM........",".........OHBBSO.........","..........OBBO..........","..........OWWO.........."],
  spitz: [".......OO...............",".......OHO..............","......MOHBO.............",".......OHBBO............","......MOHBBSO...........",".......OHBBBSO..........","......MOHBBBSO..........","........OHBBSO..........","..........OBSO..........","..........OWWO.........."],
  keiner:["........................","........................","........................","........................","........................","........................","........................","........................","..........OOOO..........","..........OMMO.........."]
};
const PX_W=24, PX_H=56, NECK0=10, BODY0=28;
function hexRgb(h){ h=h.replace("#",""); const n=parseInt(h,16); return [n>>16&255,n>>8&255,n&255]; }
function shade(rgb,f){ return f>=0 ? rgb.map(c=>Math.round(c+(255-c)*f)) : rgb.map(c=>Math.round(c*(1+f))); }

function zeichne(g) {
  const sp=SP[g.form], B=hexRgb(g.farbe), A=hexRgb(g.akz), OUT=[20,17,22];
  const HB=hexRgb(g.kopffarbe||((g.form==="scut"||g.form==="hollow")?"#1c1a1e":g.farbe));
  const cell=Array.from({length:PX_H},()=>Array(PX_W).fill(null)); // Typcodes
  // Korpusmaske
  const mask=Array.from({length:PX_H},()=>Array(PX_W).fill(false));
  sp.rows.forEach((segs,r)=>{ for(const [l,rr] of segs) for(let x=l;x<=rr;x++) mask[BODY0+r][x]=true; });
  const inM=(x,y)=>y>=0&&y<PX_H&&x>=0&&x<PX_W&&mask[y][x];
  for(let y=0;y<PX_H;y++) for(let x=0;x<PX_W;x++) if(mask[y][x]){
    const edge=!inM(x-1,y)||!inM(x+1,y)||!inM(x,y-1)||!inM(x,y+1);
    if(edge){ cell[y][x]="O"; continue; }
    let t="B"; if(!inM(x-2,y)) t="H"; else if(!inM(x+2,y)||!inM(x,y+2)) t="S";
    if(g.burst){ let d=9; for(let k=1;k<=5&&d===9;k++) if(!inM(x-k,y)||!inM(x+k,y)||!inM(x,y-k)||!inM(x,y+k)) d=k; t=d<=2?"S":d===3?"B":d===4?"D":"C"; }
    cell[y][x]=t;
  }
  // Schlagbrett, F-Löcher
  for(const [r,[l,rr]] of (g.guard?sp.guard||[]:[])) for(let x=l;x<=rr;x++){ const y=BODY0+r; if(cell[y][x]&&cell[y][x]!=="O") cell[y][x]="G"; }
  for(const [x,r] of sp.fholes||[]) cell[BODY0+r][x]="O";
  // Hals (vom Sattel bis in den Korpus) mit Bünden und Einlagen
  const headless=g.kopf==="keiner", nTop=headless?NECK0+2:NECK0, nEnd=BODY0+sp.neckIn;
  for(let y=nTop;y<nEnd;y++){ cell[y][10]="O"; cell[y][13]="O"; cell[y][11]="N"; cell[y][12]="N"; }
  const frets=[12,14,16,18,20,22,24,26,28,30,32].filter(y=>y>nTop&&y<nEnd-1);
  for(const y of frets){ cell[y][11]="R"; cell[y][12]="R"; }
  for(const y of [15,19,23,27]) if(y>nTop&&y<nEnd-1&&cell[y][11]==="N") cell[y][11]="I";
  // Kopfplatte
  HEADS[g.kopf].forEach((row,y)=>{ for(let x=0;x<PX_W;x++){ const c=row[x]; if(c&&c!=="."&&cell[y][x]==null) cell[y][x]=c==="B"||c==="H"||c==="S"?"k"+c:c; } });
  // Tonabnehmer, Brücke, Regler
  for(const r of sp.pu){ const y=BODY0+r; for(let x=8;x<=15;x++){ cell[y][x]=(x===8||x===15)?"O":"Q"; cell[y+1][x]=(x===8||x===15)?"O":"P"; } }
  for(let x=8;x<=15;x++) cell[BODY0+sp.bridge][x]=(x===8||x===15)?"O":"M";
  for(const [x,r] of sp.knobs) cell[BODY0+r][x]="K";
  const COL={O:OUT,B:B,H:shade(B,.38),S:shade(B,-.35),C:shade(B,.32),D:shade(B,.12),G:hexRgb(g.guard||"#000"),N:[62,38,22],R:[150,140,128],I:[236,230,214],W:[240,236,222],M:[205,205,210],
    kB:HB,kH:shade(HB,.3),kS:shade(HB,-.35),Q:shade(A,.25),P:A,K:A,T:shade(B,-.18)};
  if(g.burst){ COL.S=shade(B,-.62); COL.B=shade(B,-.35); COL.D=shade(B,0); COL.C=shade(B,.38); }
  let last=0; for(let y=0;y<PX_H;y++) if(cell[y].some(Boolean)) last=y; const HH=last+1;
  // Am Boden ausrichten: unten bleibt nichts frei, oben das, was die Gitarre kuerzer ist.
  const px = new Uint8Array(PX_W * PX_H * 4);
  const y0 = PX_H - HH;
  for (let y = 0; y < HH; y++) for (let x = 0; x < PX_W; x++) {
    const c = cell[y][x];
    if (!c) continue;
    const rgb = COL[c] || OUT;
    const o = ((y + y0) * PX_W + x) * 4;
    px[o] = rgb[0]; px[o + 1] = rgb[1]; px[o + 2] = rgb[2]; px[o + 3] = 255;
  }
  return { w: PX_W, h: PX_H, px };
}

/** Die Gitarren in der Reihenfolge des Bogens. */
export function gitarrenBilder() { return GITARREN.map(zeichne); }
