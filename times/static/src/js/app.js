angular.module('times', ["ui.router", 'restangular', 'angularMoment', 'froala', 'angularFileUpload', 'akoenig.deckgrid', "ngToast", 'ui.bootstrap']).run(['Restangular', "$state",function(Restangular, $state){
    // config the Restangular baseurl
    Restangular.setBaseUrl("/admin/api")
    Restangular.setErrorInterceptor(function(repsonse, defered, responseHandler){
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
            if(window.location.pathname == '/admin/login' || window.location.pathname == "/admin/"){
                // go to the dashboard
                $state.go("main.dashboard")
            }
        }
    })
}]).config(['$stateProvider', "$locationProvider",function($stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true)
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
    }).state("main.new_passages", {
        templateUrl: "/static/src/html/new_passages.html",
        url: "/new_passages",
        controller: "NewPassageController",
    }).state('main.resource', {
        templateUrl: "/static/src/html/resource.html",
        url: "/resource",
        controller: "ResourceController"
    })
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
        $scope.status = '登出成功，即将回到首页'
        $timeout(function(){
            window.location.href = '/';
        }, 1000)
    })
}]).controller('PassagesController', ['Restangular', "$scope", function(Restangular, $scope){
    $scope.setTitle("文章列表")
    Restangular.all("post").getList().then(function(response){
        $scope.passages = response
    })
}]).controller('NewPassageController', ['Restangular', "$scope", '$modal',function(Restangular, $scope, $modal){
    $scope.setTitle("新建文章")
    $scope.froalaOptions = {
        inlineMode: false,
        placeholder: "Edit Me",
        language: "zh_cn",
        buttons: ["bold", "italic", "underline", "strikeThrough", "fontSize", "fontFamily", "color", "sep", "formatBlock", "blockStyle", "align", "insertOrderedList", "insertUnorderedList", "outdent", "indent", "sep", "createLink", "insertImage", "insertVideo", "insertHorizontalRule", "undo", "redo", "html", "picManager"]
    }
    $scope.author = []
    $scope.add = function(){
        if($scope.name && $scope.job){
            $scope.author.push({name: $scope.name, job: $scope.job})
            $scope.name = ""
            $scope.job = ""
        }
    }
    $scope.delete = function(item){
        $scope.author.splice($scope.author.indexOf(item), 1)
    }
    $scope.save = function(){
        Restangular.all('post').customPUT({
            title: $scope.title,
            author: $scope.author,
            header: $scope.header

        }).then(function(response){
            // should redirect to the single post page
            console.log(response)
        })
    }
    $scope.upload = function(){
        console.log("Test")
        $modal.open({
            animation: true,
            templateUrl: "/static/src/html/selector.html",
            controller: "SelectorController",
            size: "lg"
        }).result.then(function(urls){
            $scope.header = urls[0]
        })
    }
   
}]).controller('ResourceController', ['$scope', "Restangular", "FileUploader", function($scope, Restangular, FileUploader){
    $scope.setTitle("资源管理")
    $scope.page = 1
    $scope.uploader = new FileUploader({
        url: "/admin/upload",
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
        url: "/admin/upload",
        autoUpload: true
    })
    $scope.finished = []
    $scope.ok = function(){
        $modalInstance.close($scope.finished);
    }
    $scope.uploader.onSuccessItem = function(item, response){
        if(!response.err){
            $scope.finished.push("/"+response.path)
        }
    }
    $scope.page = 1
    $scope.fillData = function(page, keyword){
        console.log(keyword)
        if (!page)
            page = $scope.page
        Restangular.all('uploaded').getList({page: page, key: keyword}).then(function(response){
            $scope.pics = response.map(function(data){
                data.path = "/upload/" + data.path;
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
}]).factory('UploaderSelector', ['FileUploader', "",function(FileUploader){
    var uploader = {};
    uploader.upload = function(callback){
        // the callback will receive a list of images selected or uploaded

    }
    return uploader;
}])