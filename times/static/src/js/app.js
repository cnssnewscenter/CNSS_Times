angular.module('times', ["ui.router", 'restangular', 'mm.foundation']).run(['Restangular', "$state",function(Restangular, $state){
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
        console.log(data)
        return data
    })
    Restangular.all("login").customGET().then(function(data){
        if(data.logined == false){
            console.log("You should login first")
            $state.go("login")
        }
    })
}]).config(['$stateProvider', "$locationProvider",function($stateProvider, $locationProvider) {
    $locationProvider.html5Mode(true)
    $stateProvider.state("login", {
        url: "/login",
        templateUrl: "/static/html/login.html",
        controller: "LoginController",
    }).state("logout", {
        template: "{{status}}",
        url: "/logout",
        controller: ['Restangular' , '$scope', '$timeout', function(Restangular, $scope, $timeout){
            console.log("Now quiting")
            $scope.status = '正在退出登录'
            Restangular.customGET("logout").then(function(){
                $scope.status = '登出成功，即将回到首页'
                $timeout(function(){
                    window.location.href = '/';
                }, 3000)
            })
        }]
    })
}]).controller('LoginController', ['Restangular', "$scope", function(Restangular, $scope){
    $scope.login = function(){
        if($scope.password && $scope.username){
            Restangular.all("login").customPOST({password: $scope.password, username:$scope.username}).then(function(response){
                if (response.err == 0 && response.logined == true){
                    console.log("You are logined!")
                    $state.go("dashboard")
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
}])