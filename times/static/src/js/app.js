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
        }else{
            // check if we in the login page 
            console.log($state.$current.url.source)
            if($state.$current.url.source == '/login' || $state.$current.url.source == "/"){
                // go to the dashboard
                $state.go("dashboard")
            }
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
        controller: "LogoutController"
    }).state("main", {
        templateUrl: "/static/html/dashboard.html",
        url: "/dashboard",
        controller: "DashboardCtrl"
    }).state("main.passages", {
        templateUrl: "/static/html/passages.html",
        url: "/passages",
        controller: "PassagesController"
    })
}]).controller('LoginController', ['Restangular', "$scope", "$state", function(Restangular, $scope, $state){
    $scope.login = function(){
        if($scope.password && $scope.username){
            Restangular.all("login").customPOST({password: $scope.password, username:$scope.username}).then(function(response){
                if (response.err == 0){
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
}]).controller('DashboardCtrl', ['$scope', function($scope){
    
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
    Restangular.all("passage").getList().then(function(){
        console.log(arguments)
    })
}])