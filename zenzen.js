!function ( win, doc, host ){

  var zen = {}

  zen.stringify = function (){
  }
  /*
   * div#id.class[attr="" attr = 0]{text} > +
   *
   * */
  zen.parse = (function (){
    var xp = /^(?:\s+|((\w+)|(?:\#([\w\-]+))|(\.[\s\w\.\-]*)|(?:\[([^\]]+)\])|(?:{([^{}]+)}))|(\>|\+|\(|\)))/g
      , create = doc.createElement.bind(doc)
      , createFragment = doc.createDocumentFragment.bind(doc)

    function setAttributes( el, attr ){
      while ( attr ) {
        attr = attr.replace(/^(?:\s+|([\w\-]+)(?:\=(?:(\w+)|\"([^\"]*)\"))?)/, function ( m, name, value, valu2 ){
          if ( name ) {
            el.setAttribute(name, value || valu2 || "")
          }
          return ""
        })
      }
    }


    function parse( zenString ){
      var element
        , zenFragment = createFragment()
        , parent, sibling, fragment
        , q = []
        , s = []

      while ( zenString ) {
        if ( !xp.test(zenString) ) {
          console.error("Invalid input")
          return false
        }
        zenString = zenString.replace(xp, function ( m, el, tag, id, cls, attr, txt, op, pos ){
          if ( el ) {
            if ( tag ) {
              element = create(tag)
              q.push(element)
            }
            else if ( id ) {
              element.id = id
            }
            else if ( cls ) {
              element.className = cls.replace(/\./g, " ").trim()
            }
            else if ( attr ) {
              setAttributes(element, attr)
            }
            else if ( txt ) {
              element.textContent = txt
            }
          }
          else if ( op ) {
            if ( op == "(" ) {
              s.push(op)
            }
            else if ( op == ")" ) {
              op = s.pop()
              while ( op != "(" ) {
                q.push(op)
                op = s.pop()
              }
            }
            else {
              el = op
              op = s[s.length - 1]
              while ( s.length && op != "(" ) {
                q.push(s.pop())
                op = s[s.length - 1]
              }
              s.push(el)
            }
          }
          return ""
        })
      }

      while ( s.length ) q.push(s.pop());
      zenFragment.appendChild(q[0])
      while ( element = q.shift() ) {
        if ( element == ">" ) {
          element = s.pop()
          parent = s.pop()
          parent.appendChild(element)
          s.push(element)
        }
        else if ( element == "+" ) {
          element = s.pop()
          sibling = s.pop()
          if ( sibling.parentNode ) {
            sibling.parentNode.appendChild(element)
            s.push(element)
          }
          else {
            fragment = createFragment()
            fragment.appendChild(sibling)
            fragment.appendChild(element)
            s.push(fragment)
          }
        }
        else {
          s.push(element)
        }
      }
      return zenFragment
    }

    return parse
  }())

  function tabCount( el, tab ){
    var tabs = ""
    while ( el != doc.body ) {
      el = el.parentNode
      tabs += tab
    }
    return tabs
  }

  zen.css = function ( root ){
    var walker = document.createNodeIterator(
        root, NodeFilter.SHOW_ELEMENT, {
          acceptNode: function (){
            return NodeFilter.FILTER_ACCEPT
          }
        }, false)
      , el, parent
      , id, cls
      , css = ""
      , ids = {}
      , classes = {}
      , tabs = ""
      , i, l

    while ( parent = el = walker.nextNode() ) {
      tabs = "";
      while ( parent != root ) {
        if ( parent.id || parent.className ) tabs += "\t";
        parent = parent.parentNode;
      }
      id = el.id;
      cls = el.className.split(" ");

      if ( id && !(id in ids) ) {
        ids[id] = 0;
        css += tabs + "#" + id + "{\n" + tabs + "}\n";
      }
      if ( el.className ) {
        i = -1
        l = cls.length;
        while ( ++i < l ) {
          if ( !(cls in classes) ) {
            classes[cls[i]] = 0
            css += tabs + "." + cls[i] + "{\n" + tabs + "}\n"
          }
        }
      }
    }
    return css
  }

  zen.html = function ( element, indent, t ){
    var markup = ""
      , tag, id, cls, attr, attrs, name
      , indent = indent || 1
      , tabcount = indent
      , tabs = ""

    while ( tabcount-- ) tabs += t || "  "

    tag = element.tagName.toLowerCase()
    id = element.id ? " id=\"" + element.id + "\"" : ""
    cls = element.className ? " class=\"" + element.className + "\"" : ""
    attr = ""
    attrs = element.attributes
    for ( var a = -1, k = attrs.length; ++a < k; ) {
      name = attrs[a].name;
      if ( name != "class" && name != "id" ) {
        attr += " " + name + "\"" + attrs[a].nodeValue + "\""
      }
    }

    markup += "<" + tag + id + cls + attr + ">"

    var children = element.childNodes
      , child

    if ( children.length ) {
      var i = -1, l = children.length
      while ( ++i < l ) {
        child = children[i]
        if ( child.nodeType == 1 ) {
          markup += "\n" + zen.html(child, indent + 1, t).replace(/^\</gm, tabs + "<")

          if ( child == element.lastChild ) {
            markup += "\n"
          }
        }
        else {
          markup += child.textContent;
        }
      }
    }
    markup += "</" + tag + ">"
    return markup
  }

  host.zen = zen
}(window, window.document, this)