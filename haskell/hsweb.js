////////////////////////////////////////////////////////////////////////////////
// Nodes

function n_syntax(name,text){
  var syntax = $('<span></span>');
  syntax.text(text);
  syntax.addClass('n_syntax');
  syntax.addClass(name);
  return syntax;
}

function n_optional(name,node,enabled){
  if(typeof node == 'undefined') throw 'node not defined';
  var optional = $('<span></span>');
  var btn = n_button('☐');
  btn.addClass('n_optional_button');
  optional.append(btn);
  optional.append(node);
  optional.addClass('n_optional');
  optional.addClass('n_disabled');
  optional.addClass(name);
  optional[0].n_enable = function(){
    btn.text('☒');
    optional.removeClass('n_disabled');
  };
  optional[0].n_disable = function(){
    btn.text('☐');
    optional.addClass('n_disabled');
  };
  btn.n_toggle(optional[0].n_enable,optional[0].n_disable);
  if(enabled) btn.click();
  return optional;
}

function n_button(caption){
  var button = $('<span></span>');
  button.text(caption);
  button.addClass('n_button');
  return button;
}

function n_add_button(){
  var btn = n_button('+');
  btn.addClass('n_add_button');
  return btn;
}

function n_sequence(nodes){
  var sequence = $('<span></span>');
  sequence.addClass('n_sequence');
  nodes.each(function(node){
    sequence.append(node);
  });
  return sequence;
}

function n_constructor_name(){
  var name = n_input({
    regex: /^[A-Z][A-Za-z0-9._]*$/,
    message: 'must be valid constructor'
  });
  name.addClass('constructor_name');
  return name;
}

function n_module_name(){
  var name = n_input({
    regex: /^[A-Z][A-Za-z0-9._]*$/,
    message: 'must be valid module name'
  });
  name.addClass('module_name');
  return name;
}

function n_module(){
  var module =
    n_sequence([n_syntax('module_module','module '),
                n_module_name(),
                n_module_exports(),
                n_syntax('module_where',' where')])
  module.addClass('n_decl');
  return module;
}

function n_module_exports(){
  return n_optional('module_exports_optional',
                    n_convar_tuple());
}

function n_parens(node){
  return n_sequence([
    n_syntax('paren','('),
    node,
    n_syntax('paren',')')
  ])
}

function n_convar_tuple(){
  return n_tuple({
    make_child: n_var_or_con_input
  });
}

function n_name_tuple(){
  return n_tuple({
    make_child: n_variable_name_input
  });
}

function n_tuple(config){
  var tuple = n_parens(n_comma_separated(config));
  tuple.addClass('n_tuple');
  return tuple;
}

function n_many_nodes(config){
  var make_child = config.make_child;
  var commas = $('<span></span>');
  var add = n_add_button();
  commas.append(add);
  var nodes = 0;
  add.n_click(function(){
    var newnode = make_child();
    if(nodes > 0)
      commas.append('<span class="n_comma">' + config.sep + '</span>');
    commas.append(newnode);
    nodes++;
  });
  return commas;
}

function n_comma_separated(config){
  config.sep = ',';
  return n_many_nodes(config);
}

function n_space_separated(config){
  config.sep = ' ';
  return n_many_nodes(config);
}

function n_variable_name_input(){
  return n_input({
    regex: /^[a-z_][a-zA-Z0-9_']*$/
  });
}

function n_var_or_con_input(){
  return n_input({
    regex: /^[A-Za-z_][a-zA-Z0-9_']*$/
  });
}

function n_input(config){
  if(config) {
    var regex = config.regex;
    var msg = config.message;
  }
  var input = $('<span></span>');
  input.text('…');
  input.addClass('n_empty');
  input.addClass('n_input');
  var state = 'closed', blank = true;
  var area = $('<input type="text"/>');
  input.n_area = area;
  var n_finish = function(){
    if(config) {
      if(area.val() && !area.val().match(regex)){
        area.addClass('n_input_nvalid');
        return false;
      }
    }
    n_action_ret = undefined;
    state = 'closed';
    input.text(area.val());
    input.removeClass('n_empty');
    area.remove();
    n_locked = undefined;
    if(input.text() == '') {
      input.addClass('n_empty');
      input.text('…');
      blank = true;
    }
  };
  var n_activate = function(){
    if(n_locked && n_locked != input) return;
    n_action_ret = function(){
      n_finish();
    };
    if(state == 'closed') {
      n_locked = input;
      if (blank) input.text('');
      state = 'open'; blank = false;
      area.val(input.text());
      input.text('');
      input.append(area);
      area.focus();
      area.blur(n_finish);
    }
  };
  input.n_click(n_activate);
  input[0].n_activate = n_activate;
  input[0].n_finish = n_finish;
  return input;
}

function n_import(){
  var imp = n_sequence([
    n_syntax('import','import '),
    n_module_name()
  ]);
  imp.addClass('n_decl n_import');
  return imp;
}

function n_decls(config){
  var make_child = config.make_child;
  var decls = $('<div></div>');
  decls.addClass('n_decls');
  var btn = n_add_button();
  decls.append(btn);
  var add_decl = function(start){
    var newnode = make_child();
    decls.append(newnode);
    n_focused = newnode;
    begin_next_node();
  };
  btn.n_click(add_decl);
  decls[0].n_add_decl = add_decl;
  return decls;
}

function n_defs(config){
  var make_child = config.make_child;
  var decls = $('<div></div>');
  decls.addClass('n_defs');
  var btn = n_add_button();
  decls.append(btn);
  btn.n_click(function(){
    var newnode = make_child();
    decls.append(newnode);
  });
  return decls;
}

function n_choice(nodes){
  var choices = $('<ul></ul>');
  choices.addClass('n_choice');
  var first = true;
  nodes.each(function(node){
    n_locked = true;
    var choice = $('<li class="n_choice_item"></li>');
    choice.append(node);
    if(first) {
      choice.addClass('n_current');
      n_focused = choice;
    }
    n_action_up = function(){
      if(n_focused.prev().length) {
        n_focused.removeClass('n_current');
        n_focused.prev().addClass('n_current');
        n_focused = choice.prev();
      }
    };
    n_action_down = function(){
      if(n_focused.next().length) {
        n_focused.removeClass('n_current');
        n_focused.next().addClass('n_current');
        n_focused = n_focused.next();
      }
    };
    n_action_ret = function(){
      try {
        choices.before(n_focused.children());
        choices.remove();
      } finally {
        n_action_up = undefined;
        n_action_down = undefined;
        n_action_ret = undefined;
        n_focused = undefined;
        n_locked = true;
      }
    };
    first = false;
    choices.append(choice);
  });
  return choices;
}

function n_data(){
  var imp = n_sequence([
    n_syntax('data','data '),
    n_constructor_name(),
    n_space_separated({
      make_child: n_variable_name_input
    }),
    n_optional('data-rhs',n_sequence([n_syntax('data-def','= '),
                                      n_data_rhs]))
  ]);
  imp.addClass('n_decl n_data');
  return imp;
}

function n_data_rhs(){
  return n_many_nodes({
    make_child: n_constructor_def,
    sep: ' | '
  })
}

function n_constructor_def(){
  return n_sequence([
    n_constructor_name(),
    n_space_separated({
      make_child: n_var_or_con_input
    })
  ]);
}

function n_exp(){
  return n_variable_name_input();
}

function n_def(){
  var def = n_sequence([
    n_variable_name_input(),
    n_syntax('def-eq',' = ' ),
    n_exp()
  ]);
  def.addClass('n_decl n_def');
  return def;
}

function n_class(){
  var cls = n_sequence([
    n_syntax('class','class '),
    n_constructor_name(),
    n_optional('constructor_vars',n_space_separated({
      make_child: n_var_or_con_input
    })),
    n_optional('class-where',
               n_sequence([
                 n_syntax('class-where',' where '),
                 n_defs({ make_child: n_def })
               ]))
  ]);
  cls.addClass('n_decl n_data');
  return cls;
}

function n_decl_choice(){
  var choice = n_choice([n_data(),n_class(),n_def()]);
  return choice;
}

function n_file(){
  n_imports = n_decls({
    make_child: function(){
      return n_optional('optional_import',n_import(),true);
    }
  });
  n_module_decl = n_optional('optional_module',n_module());
  return n_sequence([
    n_module_decl,
    n_imports,
    n_decls({ make_child: n_decl_choice })
  ]);
}

////////////////////////////////////////////////////////////////////////////////
// General functions

function jump_to_imports(){
  n_imports.n_focus();
  n_imports[0].n_add_decl(true);
}

function jump_to_module(){
  n_module_decl.n_focus();
}

function begin_next_node(){
  if(n_focused){
    if(n_focused[0].n_finish) n_focused[0].n_finish();
    var editable_nodes = n_focused.find('.n_empty,.n_optional').first();
    if(editable_nodes.length) {
      editable_nodes.n_focus();
      editable_nodes.n_activate();
      return;
    }
    var editable_nodes = n_focused.parent().find('.n_empty,.n_optional').first();
    if(editable_nodes.length) {
      editable_nodes.n_focus();
      editable_nodes.n_activate();
      return;
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// jQuery/JS extensions

$.fn.n_activate = function(){
  if($(this)[0].n_activate) $(this)[0].n_activate();
};

$.fn.n_focus = function(){
  $('.n_focused').n_defocus();
  var node = $(this);
  node.focus();
  node.addClass('n_focused');
  node.n_enable();
  n_focused = node;
};

$.fn.n_defocus = function(){
  $(this).removeClass('n_focused');
};

$.fn.n_enable = function(){
  if($(this)[0].n_enable) $(this)[0].n_enable();
};

$.fn.n_click = function(f){
  $(this).click(function(){
    if(n_locked) return;
    if($(this).n_is_disabled())
      return false;
    else
      return f.call(this);
  })
};

$.fn.n_toggle = function(f,g){
  $(this).toggle(function(){
    if(n_locked) return;
    return f.call(this);
  },function(){
    if(n_locked) return;
    return g.call(this);
  })
};

$.fn.n_is_disabled = function(){
  return $(this).hasClass('.n_disabled') ||
    $(this).parents('.n_disabled').length > 0;
};

Array.prototype.each = function(f){
  for (var i = 0; i < this.length; i++) {
    if (f(this[i],i)==false) return;
  }
};

////////////////////////////////////////////////////////////////////////////////
// Globals

var n_focused, n_locked;
var n_action_up, n_action_down, n_action_ret;
var k_down = 40, k_up = 38, k_left = 37, k_right = 39, k_ret = 13, k_i = 73;
var k_tab = 9, k_m = 77;
var n_imports, n_module_decl;

////////////////////////////////////////////////////////////////////////////////
// Entry point

$(document).ready(function(){
  $('body').append(n_file());
  $('body').keydown(function(e){
    console.log(e.which);
    switch(e.which){
    case k_down: if(n_action_down) { n_action_down(); return false; } break;
    case k_up: if(n_action_up) { n_action_up(); return false; } break;
    case k_ret: if(n_action_ret) { n_action_ret(); return false; } break;
    case k_i: if(!n_locked) { jump_to_imports(); return false; } break;
    case k_m: if(!n_locked) { jump_to_module(); return false; } break;
    case k_tab: if(!n_locked) { begin_next_node(); return false; } break; return false;
    }
  });
});
