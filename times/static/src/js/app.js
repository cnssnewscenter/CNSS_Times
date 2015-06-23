angular.module('times', ["ui.router", 'restangular', 'angularMoment', 'froala', 'angularFileUpload', 'akoenig.deckgrid', "ngToast", 'ui.bootstrap', 'ui.bootstrap.datetimepicker']).run(['Restangular', "$state", "$rootScope",function(Restangular, $state, $rootScope){
    // config the Restangular baseurl
    Restangular.setBaseUrl(baseurl+"/admin/api")
    Restangular.setErrorInterceptor(function(response, defered, responseHandler){
        if(response.status == 403){
            console.log("Should login")
            $state.go("login")
            return true
        }
    })
    Restangular.addResponseInterceptor(function(data, operation, what, url, repsonse, defered){
        if(operation == "getList"){
            if (!data.err){
                return data.data
            }
        } 
        return data
    })
    Restangular.all("login").customGET().then(function(data){
        if(data.logined == false){
            console.log("You should login first")
            $state.go("login")
        }else{
            // check if we in the login page 
            if(window.location.hash == '/login' || window.location.hash == ""){
                // go to the dashboard
                $state.go("main.dashboard")
            }
        }
    })
}]).config(['ngToastProvider', function(ngToastProvider) {
    ngToastProvider.configure({
        animation: 'slide' // or 'fade'
    });
}]).config(['$stateProvider', "$locationProvider", '$urlRouterProvider',function($stateProvider, $locationProvider, $urlRouterProvider) {
    $stateProvider.state("login", {
        url: "/login",
        templateUrl: "/static/src/html/login.html",
        controller: "LoginController",
    }).state("logout", {
        template: "{{status}}",
        url: "/logout",
        controller: "LogoutController"
    }).state("main", {
        templateUrl: "/static/src/html/framework.html",
        controller: ['$scope', '$state', function($scope, $state){
            $scope.setTitle = function(name){
                $scope.title = name
            }
        }]
    }).state("main.dashboard", {
        templateUrl:"/static/src/html/dashboard.html",
        url: "/dashboard",
        controller: "DashboardController"
    }).state("main.passages", {
        templateUrl: "/static/src/html/passages.html",
        url: "/passages",
        controller: "PassagesController"
    }).state("main.passage", {
        templateUrl: "/static/src/html/new_passages.html",
        url: "/passage/:id",
        controller: "NewPassageController",
    }).state("main.new_passages", {
        templateUrl: "/static/src/html/new_passages.html",
        url: "/new_passages",
        controller: "NewPassageController",
    }).state('main.resource', {
        templateUrl: "/static/src/html/resource.html",
        url: "/resource",
        controller: "ResourceController"
    })
    $urlRouterProvider.otherwise('/dashboard')
}]).controller('LoginController', ['Restangular', "$scope", "$state", function(Restangular, $scope, $state){
    $scope.login = function(){
        if($scope.password && $scope.username){
            Restangular.all("login").customPOST({password: $scope.password, username:$scope.username}).then(function(response){
                if (response.err == 0){
                    console.log("You are logined!")
                    $state.go("main.dashboard")
                }else{
                    console.log("Login Failed")
                    $scope.err_msg = "登录失败：" + response.msg
                }
            }, function(err){
                console.log(arguments)
                $scope.err_msg = "服务器似乎出了一些问题 ：/"
            })
        }
    }
}]).controller('DashboardController', ['$scope', "Restangular",function($scope, Restangular){
    $scope.setTitle("仪表盘")
    Restangular.all('index_stats').customGET().then(function(response){
        if(!response.err){
            $scope.data = response
        }
    })
}]).controller('LogoutController', ['Restangular' , '$scope', '$timeout', function(Restangular, $scope, $timeout){
    $scope.setTitle('退出登录')
    $scope.status = '正在退出登录'
    Restangular.all("logout").customGET().then(function(){
        $scope.status = '退出成功，即将回到首页'
        $timeout(function(){
            window.location.href = baseurl;
        }, 1000)
    })
}]).controller('PassagesController', ['Restangular', "$scope", "ngToast",function(Restangular, $scope, ngToast){
    $scope.setTitle("文章列表")
    $scope.fresh = function(){
        Restangular.all("post").getList().then(function(response){
            $scope.passages = response
        })
    }
    $scope.fresh()
    $scope.del = function(post){
        if(confirm('确认要删除吗')){
           Restangular.one('post', post.id).remove().then(function(){
               $scope.fresh()
           }) 
        }
    }
    $scope.update_status = function(p){
        Restangular.one("post", p.id).customPOST(p).then(function(){
            $scope.fresh()
            ngToast.create("已更新状态")
        })
    }
}]).controller('NewPassageController', ["$state", 'Restangular', "$scope", '$modal', "ngToast", "$stateParams", function($state, Restangular, $scope, $modal, ngToast, $stateParams){
    $scope.opened = false;
    State = $state
    $scope.today = (new　Date()).toISOString().split("T")[0]
    if($state.$current.name == "main.new_passages"){
        $scope.passage = {}
        $scope.setTitle("新建文章")
    }else{
        Restangular.one('post', $stateParams.id).get().then(function(response){
            if(!response.err){
                $scope.passage = response.data
                $scope.passage.published = new Date(response.data.published)
            }else{
                ngToast.create("服务器出了一些问题。。。")
                setTimeout(function(){
                    $state.go("main.passages")
                }, 2000)
            }
        })
        $scope.setTitle("编辑文章")

    }
    
    $scope.froalaOptions = {
        inlineMode: false,
        placeholder: "开始编辑吧",
        imageUpload: true,
        imageResize: false,
        defaultImageWidth: 0,
        language: "zh_cn",
        imageUploadURL: baseurl+'/admin/upload',
        buttons: ["bold", "italic", "underline", "strikeThrough", "fontSize", "fontFamily", "color", "sep", "formatBlock", "blockStyle", "align", "insertOrderedList", "insertUnorderedList", "outdent", "indent", "sep", "createLink", "insertImage", "insertVideo", "insertHorizontalRule", "undo", "redo", "html", "picManager"]
    }
    $scope.author = []
    $scope.add = function(){
        if($scope.name && $scope.job){
            if(!$scope.passage.author){
                $scope.passage.author = []
            }
            $scope.passage.author.push({name: $scope.name, job: $scope.job})
            $scope.name = ""
            $scope.job = ""
        }
    }
    $scope.delete = function(item){
        $scope.author.splice($scope.author.indexOf(item), 1)
    }
    $scope.save = function(){
        if($state.$current.name == "main.new_passages"){
            return Restangular.all('post').customPUT($scope.passage).then(function(response){
                console.log(response)
                ngToast.create("保存成功")
            }, function(){
                ngToast.warning("保存失败")
            })
        }else{
            return Restangular.one('post', $stateParams.id).customPOST($scope.passage).then(function(response){
                console.log(response)
                ngToast.create("保存成功")
            }, function(response){
                console.log(response)
                ngToast.warning("保存失败")
            }) // save the change
        }
        
    }
    $scope.upload = function(){
        console.log("Test")
        $modal.open({
            animation: true,
            templateUrl: "/static/src/html/selector.html",
            controller: "SelectorController",
            size: "lg"
        }).result.then(function(urls){
            $scope.passage.header = urls[0]
        })
    }
    $scope.time_set = function(){
        $scope.opened = false
    }
}]).controller('ResourceController', ['$scope', "Restangular", "FileUploader", function($scope, Restangular, FileUploader){
    $scope.setTitle("资源管理")
    $scope.page = 1
    $scope.uploader = new FileUploader({
        url: baseurl+"admin/upload",
        autoUpload: true,
        removeAfterUpload: true,
    })
    $scope.uploader.onSuccessItem = function(){
        $scope.get(1);
    }
    $scope.get = function(page){
        if(page > 0){
            Restangular.all('uploaded').getList({page:page}).then(function(response){
                $scope.page = page
                $scope.resource = response
            })
        }
    }
    $scope.get(1)

}]).controller('SelectorController', ['$scope', "FileUploader", "$modalInstance", 'Restangular',function($scope, FileUploader, $modalInstance, Restangular){
    $scope.uploader = new FileUploader({
        url: baseurl+"admin/upload",
        autoUpload: true
    })
    $scope.finished = []
    $scope.ok = function(){
        $modalInstance.close($scope.finished);
    }
    $scope.uploader.onSuccessItem = function(item, response){
        if(!response.err){
            $scope.finished.push(response.path)
        }
    }
    $scope.page = 1
    $scope.fillData = function(page, keyword){
        console.log(keyword)
        if (!page)
            page = $scope.page
        Restangular.all('uploaded').getList({page: page, key: keyword}).then(function(response){
            $scope.pics = response.filter(function(pic){
                return /\.(?:gif|jpe?g|png)$/.test(pic.src)
            }).map(function(data){
                $scope.page = page
                return data
            })
        })
    }
    $scope.toggle = function(pic){
        console.log(pic)
        if($scope.finished.indexOf(pic.path) >= 0){
            $scope.finished.splice($scope.finished.indexOf(pic.path),1)
            pic.in = false
        }else{
            $scope.finished.push(pic.path)
            pic.in = true
        }
    }
}]).filter("status", function(){
    return function(input){
        switch(input){
            case "toView":
                return "等待审阅";
            case "toPublish":
                return "等待发布";
            case "published":
                return "已发布";
            default:
                return "未知"
        }
    }
})