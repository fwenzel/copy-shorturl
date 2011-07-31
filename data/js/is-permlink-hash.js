/** Test if anchor is in-page link with hash */
self.on('context', function(node) {
    return (node.protocol == document.location.protocol && 
            node.hostname == document.location.hostname && 
            node.pathname == document.location.pathname)
});
