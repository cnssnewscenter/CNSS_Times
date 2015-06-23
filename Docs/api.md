# 部署

1. 推荐的 Nginx 配置
    server {
        listen       80;
        server_name  www.new1.uestc.edu.cn;
        location /times {
                #root   /usr/share/nginx/html;
                #index  index.html index.htm;
            proxy_pass http://127.0.0.1:5000;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Scheme $scheme;
            proxy_set_header X-Script-Name /times;
        }
        location /times/static {
            root /<your-static-file>/;
        }
    }

2. `gunicorn -b 127.0.0.1:5000 times:app -w 1`

3. 写个 supervisord 配置