// Hook up to context menu click event.
self.on('click', function(node, data) {
  // Send href URL back to be shortened.
  if (node.href) {
    self.postMessage({short: false, url: node.href});
  }
});
