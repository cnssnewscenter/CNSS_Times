(function($){
	$.Editable.DEFAULTS = $.extend($.Editable.DEFAULTS, {
		picsManager: true,
		searchPath: "/admin/api/uploaded"
	})
	$.Editable.prototype.buildManager = function(){
		var manager = this.manager = {
			page: 1,
			modal: $(this.mediaManagerHtml()).appendTo("body"),
			input_delay: 0,
		};
		manager.images = manager.modal.find(".f-image-list"),
		manager.filter = manager.modal.find('input')

		this.manager.modal.find(".prev").on("click", function(){
			if(manager.page>1){
				manager.page--;
				this.mediaManage_refresh()
			}
		}.bind(this))
		this.manager.modal.find(".next").on("click", function(){
			manager.page++;
			this.mediaManage_refresh()
		}.bind(this))
		this.manager.images.on("click", function(event){
			if(event.target.nodeName.toLowerCase() == 'img'){
				this.writeImage($(event.target).attr("src"))
				this.manager.modal.hide()
			}
		}.bind(this))
		this.manager.modal.hide()
		this.addListener("destroy", function(){
			this.destoryManager()
		}.bind(this))
		this.manager.modal.on("click", function(event){
			if(this.manager.modal[0] === event.target){
				this.manager.modal.hide();
			}
		}.bind(this))
		this.manager.filter.on("input keyup", function(){
			clearTimeout(this.manager.input_delay)
			this.manager.input_delay = setTimeout(function(){
				this.mediaManage_refresh()
			}.bind(this), 500)
		}.bind(this))
	}
	$.Editable.initializers.push($.Editable.prototype.buildManager);
	$.Editable.prototype.mediaManagerHtml = function(){
		return '<div class="froala-modal" id="pics-manager-' + this._id + '">' +
			'<div class="f-modal-wrapper">' +
				'<h4>图片资源</h4>' +
				'<label>筛选：<input type="text" class="image-filter"></label>' +
				'<div class="f-image-list">' +
				'</div>' +
				'<div class="pags">' +
					'<a href="#" class="prev">上一页</a>' +
					'第 <span class="current"></span> 页' +
					'<a href="#" class="next">下一页</a>' +
				'</div>' +
				'<small>想要上传图片，请点击图片上传或到资源管理中上传</small>'
			'</div>' +
		'</div>';
	}
	$.Editable.prototype.mediaManage_refresh = function(){
		var manager = this.manager;
		$.get(this.options.searchPath, {page: manager.page, key: manager.filter.val()}, function(response){
			if(!response.err){
				manager.images.empty();
				response.data.forEach(function(pics){
					$("<img>").addClass("img-responsive thumbnail").attr("src", "/upload/"+pics.path).appendTo(manager.images)
				});
				manager.modal.find(".current").text(manager.page);
			}
		})
	}
	$.Editable.prototype.destoryManager = function(){
		this.manager.modal.empty();
		delete this.manager;
	}

	$.Editable.commands = $.extend($.Editable.commands, {
		picManager: {
			title: "图片管理",
			icon: "fa fa-image",
			refresh: function(){	
			},
			callback: function(){
				this.manager.modal.toggle();
				this.mediaManage_refresh();
			},
			undo: true
		}
	})
})(jQuery);