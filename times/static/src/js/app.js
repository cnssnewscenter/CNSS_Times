angular.module('times', ["ui.router", 'restangular', 'mm.foundation', 'angularMoment', 'froala']).run(['Restangular', "$state",function(Restangular, $state){
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
            console.log($state.$current.url)
            // if($state.$current.url.source == '/login' || $state.$current.url.source == ""){
            //     // go to the dashboard
            //     $state.go("main.dashboard")
            // }
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
}]).controller('DashboardController', ['$scope', function($scope){
    $scope.setTitle("仪表盘")
}]).controller('LogoutController', ['Restangular' , '$scope', '$timeout', function(Restangular, $scope, $timeout){
    console.log("Now quiting")
    $scope.status = '正在退出登录'
    Restangular.all("logout").customGET().then(function(){
        $scope.status = '登出成功，即将回到首页'
        $timeout(function(){
            window.location.href = '/';
        }, 3000)
    })
}]).controller('PassagesController', ['Restangular', "$scope", function(Restangular, $scope){
    $scope.setTitle("文章列表")
    Restangular.all("post").getList().then(function(response){
        $scope.passages = response
    })
}]).controller('NewPassageController', ['Restangular', "$scope", function(Restangular, $scope){
    $scope.setTitle("新建文章")
    $scope.froalaOptions = {
        inlineMode: false,
        placeholder: "Edit Me",
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
}])