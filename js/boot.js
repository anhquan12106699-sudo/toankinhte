/* Thay cho các thuộc tính onload/onerror nằm trực tiếp trong HTML (CSP không cho phép inline handler) */
(function(){
  var p=document.getElementById('purifyScript');
  if(p){
    var done=function(){ window.__purifyDone&&window.__purifyDone(); };
    p.addEventListener('load',done); p.addEventListener('error',done);
  }
})();
