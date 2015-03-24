var lis = Array.prototype.slice.call(document.getElementsByTagName('li'), 0);
lis.forEach(function(li) {
  li.addEventListener('click', function(e) {
    lis.forEach(function(li){
      if( li === e.target ) { return; }
      li.className = "";
    });
    e.target.className = "selected";
  });
});

boa.bind('#indicator', 'top').to('.selected', 'clientTop');
