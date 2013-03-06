$.fn.doTheAjax = function() {
  console.log(this.attr('action'), this.attr('method'), this.serializeObject());
  return $.ajax({
    url: this.attr('action'),
    type: this.attr('method'),
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify(this.serializeObject())
  });
}

$.fn.serializeObject = function()
{
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
};