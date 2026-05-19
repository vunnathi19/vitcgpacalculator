
/* ---------- LOADER ---------- */
setTimeout(() => {
  document.getElementById("loader").style.display = "none";
  document.getElementById("app").style.display = "block";
}, 5000);

/* ---------- GPA ---------- */

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
    "📊 GPA = "+window.currentGPA.toFixed(2);
}

/* ---------- CGPA ---------- */

function addSem(){
  let t=document.getElementById("cgpaTable");
  let r=t.insertRow();
  r.innerHTML=`
  <td>Sem</td>
  <td><input type="number" step="0.01"></td>
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
    "📈 CGPA = "+window.currentCGPA.toFixed(2);
}

/* ---------- ADVISER ---------- */

function gp2(g){
  return {S:10,A:9,B:8,C:7,D:6,E:5,F:0}[g]||0;
}

function upgrade(g){
  const order=["F","E","D","C","B","A","S"];
  let i=order.indexOf(g);
  if(i<0 || i===order.length-1) return g;
  return order[i+1];
}

function simulate(grades,map){
  let sum=0;
  for(let i=0;i<grades.length;i++){
    let g=map[i]||grades[i];
    sum+=gp2(g);
  }
  return sum/grades.length;
}

async function analyse(){

  let file=document.getElementById("img").files[0];
  if(!file) return alert("Upload image first");

  let text = await Tesseract.recognize(file,'eng')
    .then(r=>r.data.text);

  let grades=[];
  text.split("\n").forEach(l=>{
    let m=l.match(/[ABCDEF]/g);
    if(m) grades.push(m[0]);
  });

  if(grades.length<3){
    document.getElementById("advice").innerText =
      "Not enough grade data detected.";
    return;
  }

  let current = simulate(grades,{});

  let weak = grades
    .map((g,i)=>({i,g,v:gp2(g)}))
    .sort((a,b)=>a.v-b.v)
    .slice(0,3);

  let msg="📊 CURRENT CGPA: "+current.toFixed(2)+"\n\n";

  msg+="⚠️ WEAK SUBJECTS:\n";
  weak.forEach((w,i)=>{
    msg+=(i+1)+". Subject "+(w.i+1)+" → "+w.g+"\n";
  });

  msg+="\n📈 IMPROVEMENT CASES:\n";

  let map={};

  weak.forEach(w=>{
    let m={};
    m[w.i]=upgrade(w.g);
    let newCGPA=simulate(grades,m);

    msg+="Improve Subject "+(w.i+1)+" → CGPA "+newCGPA.toFixed(2)+"\n";

    map[w.i]=upgrade(w.g);
  });

  let best=simulate(grades,map);
  window.bestCGPA=best;

  msg+="\n🔥 BEST CASE (ALL 3): "+best.toFixed(2);

  document.getElementById("advice").innerText=msg;
}
