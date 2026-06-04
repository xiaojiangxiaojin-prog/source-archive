# Lab Escape

一个独立的 2D 像素风小游戏网站。

## 玩法

- 手机端：左侧虚拟摇杆移动，右侧按钮按住玩手机。
- 电脑端：WASD / 方向键移动，按住空格玩手机。
- 拿齐 3 张通行卡，从出口离开。
- 靠近老师会被找茬扣分，分数低于 60 失败。
- 不玩手机会掉健康值，健康值归零失败。
- 玩手机可以恢复健康值，但被老师发现会扣更多分。

## 独立部署

```bash
cd /home/jjq/game-site
docker compose up -d --build
```

默认容器端口：

```txt
127.0.0.1:3001
```

以后接域名时，把 `nginx-game-site.conf.example` 复制到 Nginx 站点配置，并把 `server_name` 改成你的小游戏域名。
