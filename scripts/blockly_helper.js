/**
 * Backup code blocks to localStorage.
 */
function backup_blocks() {
  if ('localStorage' in window) {
    var xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    window.localStorage.setItem('code', Blockly.Xml.domToText(xml));
  }
}

/**
 * Restore code blocks from localStorage.
 */
function restore_blocks() {
  if ('localStorage' in window && window.localStorage.code) {
    var xml = Blockly.Xml.textToDom(window.localStorage.code);
    Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
  }
}

/**
 * Discard all blocks from the workspace.
 */
function discard() {
  var count = Blockly.mainWorkspace.getAllBlocks().length;
  if (count < 2 || window.confirm('Delete all ' + count + ' blocks?')) {
    Blockly.mainWorkspace.clear();
    renderContent();
  }
}

/*
 * auto save and restore blocks
 */
function auto_save_and_restore_blocks() {
  // Restore saved blocks in a separate thread so that subsequent
  // initialization is not affected from a failed load.
  window.setTimeout(restore_blocks, 0);
  // Hook a save function onto unload.
  bindEvent(window, 'unload', backup_blocks);
  tabClick(selected);

  // Init load event.
  var loadInput = document.getElementById('load');
  loadInput.addEventListener('change', load, false);
  document.getElementById('fakeload').onclick = function() {
    loadInput.click();
  };
}

/**
 * Bind an event to a function call.
 * @param {!Element} element Element upon which to listen.
 * @param {string} name Event name to listen to (e.g. 'mousedown').
 * @param {!Function} func Function to call when event is triggered.
 *     W3 browsers will call the function with the event object as a parameter,
 *     MSIE will not.
 */
function bindEvent(element, name, func) {
  if (element.addEventListener) {  // W3C
    element.addEventListener(name, func, false);
  } else if (element.attachEvent) {  // IE
    element.attachEvent('on' + name, func);
  }
}

//loading examples via ajax
var ajax;
function createAJAX() {
  if (window.ActiveXObject) { //IE
    try {
      return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
      try {
        return new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e2) {
        return null;
      }
    }
  } else if (window.XMLHttpRequest) {
    return new XMLHttpRequest();
  } else {
    return null;
  }
}

function onSuccess() {
  if (ajax.readyState == 4) {
    if (ajax.status == 200) {
      try {
      var xml = Blockly.Xml.textToDom(ajax.responseText);
      } catch (e) {
        alert('Error parsing XML:\n' + e);
        return;
      }
      var count = Blockly.mainWorkspace.getAllBlocks().length;
      if (count && confirm('Replace existing blocks?\n"Cancel" will merge.')) {
        Blockly.mainWorkspace.clear();
      }
      Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
    } else {
      alert("Server error");
    }
  }
}

function load_by_url(uri) {
  ajax = createAJAX();
  if (!ajax) {
　　   alert ('Not compatible with XMLHttpRequest');
　　   return 0;
　  }
  if (ajax.overrideMimeType) {
    ajax.overrideMimeType('text/xml');
  }

　　ajax.onreadystatechange = onSuccess;
　　ajax.open ("GET", uri, true);
　　ajax.send ("");
}

function uploadCode(device_id, code, callback) {
    var target = document.getElementById('content_code');
    var spinner = new Spinner().spin(target);

    var async = true;

    var request = new XMLHttpRequest();
    
    request.onreadystatechange = function() {
        if (request.readyState != 4) { 
            return; 
        }
        
        spinner.stop();
        
        var status = parseInt(request.status); // HTTP response status, e.g., 200 for "200 OK"
        var errorInfo = null;
        switch (status) {
        case 200:
            break;
        case 0:
            errorInfo = "code 0\n\nCould not connect to server at " + url + ".  Is the local web server running?";
            break;
        case 400:
            errorInfo = "code 400\n\nBuild failed - probably due to invalid source code.  Make sure that there are no missing connections in the blocks.";
            break;
        case 500:
            errorInfo = "code 500\n\nUpload failed.  Is the Arduino connected to USB port?";
            break;
        case 501:
            errorInfo = "code 501\n\nUpload failed.  Is 'ino' installed and in your path?  This only works on Mac OS X and Linux at this time.";
            break;
        default:
            errorInfo = "code " + status + "\n\nUnknown error.";
            break;
        };
        
        callback(status, errorInfo);
    };

    request.open("POST", "/upload?id=" + device_id, async);
    request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
    request.send(code);
}

function uploadClick() {
    var device_id_element = document.getElementById('photon_device')
    var device_id = device_id_element.options[device_id_element.selectedIndex].value;
    var code = Blockly.Arduino.workspaceToCode();
    
    uploadCode(device_id, code, function(status, errorInfo) {
        if (status == 200) {
            alert("Program uploaded ok");
        } else {
            alert("Error uploading program: " + errorInfo);
        }
    });
}
