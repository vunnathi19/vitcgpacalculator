
/* ---------------- GPA ---------------- */

function gp(g){
  return {S:10,A:9,B:8,C:7,D:6,E:5,F:0}[g]||0;
}

function addRow(){
  let t=document.getElementById("gpaTable");
  let r=t.insertRow();

  r.innerHTML=`
  <td><input></td>
  <td><input type="number" value="3"></td>
  <td>
    <select>
      <option>S</option><option>A</option><option>B</option>
      <option>C</option><option>D</option><option>E</option><option>F</option>
    </select>
  </td>
  <td></td><td></td>`;
}

function calcGPA(){
  let t=document.getElementById("gpaTable");
  let tc=0,tp=0;

  for(let i=1;i<t.rows.length;i++){
    let r=t.rows[i];
    let c=+r.cells[1].querySelector("input").value;
    let g=r.cells[2].querySelector("select").value;

    let p=gp(g);
    tc+=c;
    tp+=c*p;

    r.cells[3].innerText=p;
    r.cells[4].innerText=c*p;
  }

  window.currentGPA = tp/tc;

  document.getElementById("gpaOut").innerText =
    "GPA: " + window.currentGPA.toFixed(2);
}

/* ---------------- CGPA ---------------- */

function addSem(){
  let t=document.getElementById("cgpaTable");
  let r=t.insertRow();

  r.innerHTML=`
  <td>Sem</td>
  <td><input type="number"></td>
  <td><input type="number" value="20"></td>`;
}

function calcCGPA(){
  let t=document.getElementById("cgpaTable");
  let tp=0,tc=0;

  for(let i=1;i<t.rows.length;i++){
    let r=t.rows[i];
    let g=+r.cells[1].querySelector("input").value;
    let c=+r.cells[2].querySelector("input").value;

    tp+=g*c;
    tc+=c;
  }

  window.currentCGPA = tp/tc;

  document.getElementById("cgpaOut").innerText =
    "CGPA: " + window.currentCGPA.toFixed(2);
}

/* ---------------- ANALYZER (PRO OCR) ---------------- */

async function analyse(){

  let file=document.getElementById("img").files[0];
  if(!file) return alert("Upload image");

  /* ---------- preprocess ---------- */
  let processed = await new Promise(res=>{

    let img=new Image();
    img.src=URL.createObjectURL(file);

    img.onload=function(){

      let canvas=document.createElement("canvas");
      let ctx=canvas.getContext("2d");

      canvas.width=img.width;
      canvas.height=img.height;

      ctx.drawImage(img,0,0);

      let data=ctx.getImageData(0,0,canvas.width,canvas.height);
      let d=data.data;

      for(let i=0;i<d.length;i+=4){
        let avg=(d[i]+d[i+1]+d[i+2])/3;
        avg = avg>135?255:0;
        d[i]=d[i+1]=d[i+2]=avg;
      }

      ctx.putImageData(data,0,0);
      res(canvas.toDataURL());
    }
  });

  /* ---------- OCR ---------- */
  let result = await Tesseract.recognize(processed,'eng',{
    tessedit_char_whitelist:'ABCDEF0123456789'
  });

  let text=result.data.text;

  /* ---------- PARSE ---------- */
  let grades=[];

  text.split("\n").forEach(l=>{
    let m=l.match(/([A-F])\s*$/);
    if(m) grades.push(m[1]);
  });

  if(grades.length<3){
    document.getElementById("out").innerText =
      "⚠ Cannot detect valid grades clearly";
    return;
  }

  /* ---------- CGPA ---------- */
  let credits = grades.map(()=>3);

  function simulate(grades,map){
    let sum=0;
    let total=0;

    for(let i=0;i<grades.length;i++){
      let g = map[i] || grades[i];

      sum += gp(g) * credits[i];
      total += credits[i];
    }

    return sum/total;
  }

  let current = simulate(grades,{});

  /* ---------- WEAK ---------- */
  let weak = grades
    .map((g,i)=>({i,g,v:gp(g)}))
    .sort((a,b)=>a.v-b.v)
    .slice(0,3);

  let msg="CURRENT CGPA: "+current.toFixed(2)+"\n\n";

  msg+="WEAK SUBJECTS:\n";

  weak.forEach((w,i)=>{
    msg+=(i+1)+". Subject "+(w.i+1)+" → "+w.g+"\n";
  });

  msg+="\nIMPROVEMENTS:\n";

  let map={};

  weak.forEach(w=>{
    let temp={};
    temp[w.i]= (["F","E","D","C","B","A","S"][["F","E","D","C","B","A","S"].indexOf(w.g)+1] || w.g);

    let newCGPA = simulate(grades,temp);

    msg+="Improve "+w.g+" → CGPA "+newCGPA.toFixed(2)+"\n";

    map[w.i]=temp[w.i];
  });

  let best = simulate(grades,map);

  msg+="\nBEST CASE: "+best.toFixed(2);

  document.getElementById("out").innerText=msg;
}
