'''
公共頻道外接系統 — 即時抓包 + WebSocket 推播 (無 GUI 版)
-------------------------------------------------
* LIVE_CAPTURE=True 時使用 Scapy AsyncSniffer 監聽 tcp/32800
* 所有解析結果經由 WebSocket 推播給 Web 前端
'''

import re, struct, sys, time, threading, asyncio, json, datetime
from pathlib import Path
from scapy.all import AsyncSniffer, TCP
import websockets
from queue import Queue
import subprocess
import webbrowser
from collections import deque

# ======== 設定 ========
LIVE_CAPTURE = True
PORT = 32800
BPF_FILTER = f"tcp port {PORT}"
WEBSOCKET_PORT = 8765

# ======== 封包解析核心 ========
class ChatParser:
    KNOWN = {"Nickname", "Channel", "Text", "Type", "ProfileCode", "UserId"}

    @staticmethod
    def _parse_struct(data: bytes) -> dict:
        out, colors = {}, []
        i, L = 0, len(data)
        MAX_VAL_LEN = 256

        while i + 4 <= L:
            name_len = int.from_bytes(data[i:i+4], "little")
            if not 0 < name_len <= 64 or i + 4 + name_len + 6 > L:
                i += 1; continue

            try:
                name = data[i+4:i+4+name_len].decode("ascii")
            except UnicodeDecodeError:
                i += 1; continue

            cur = i + 4 + name_len
            type_tag = int.from_bytes(data[cur:cur+2], "little")
            val_len  = int.from_bytes(data[cur+2:cur+6], "little")
            v_start, v_end = cur + 6, cur + 6 + val_len
            if v_end > L or val_len > MAX_VAL_LEN:
                i += 1; continue

            if name != "Channel":
                if name in ChatParser.KNOWN:
                    if type_tag == 4:
                        try:
                            out[name] = data[v_start:v_end].decode("utf-8", "replace")
                        except Exception:
                            out[name] = "[INVALID UTF8]"
                elif name.startswith("#") and name_len == 7:
                    colors.append(name)

            i = v_end

        j = 0
        while j + 4 <= L:
            name_len = int.from_bytes(data[j:j+4], "little")
            if not 0 < name_len <= 64 or j + 4 + name_len + 5 > L:
                j += 1; continue
            try:
                name = data[j+4:j+4+name_len].decode("ascii")
            except UnicodeDecodeError:
                j += 1; continue

            if name == "Channel":
                cur = j + 4 + name_len
                type_tag = data[cur]
                val_len = int.from_bytes(data[cur+1:cur+5], "little")
                if type_tag == 2 and 0 < val_len < 9999:
                    out["Channel"] = f"CH{val_len}"
                    break
            j += 1

        if colors:
            out["color1"] = colors[0]
        if len(colors) > 1:
            out["color2"] = colors[1]

        floats = []
        k = max(i, j)
        while k + 4 <= L:
            floats.append(struct.unpack_from("<f", data, k)[0])
            k += 4
        out["floats"] = floats

        # 新增時間戳
        now = datetime.datetime.now()
        out["timestamp"] = now.strftime("[%Y-%m-%d %H:%M:%S]")

        return out

    @classmethod
    def parse_packet_bytes(cls, blob: bytes) -> dict:
        return cls._parse_struct(blob[8:])  # 去掉 'TOZ ' + size

# ======== WebSocket Server ========
broadcast_queue = Queue()
message_buffer = deque(maxlen=100)
clients = set()

async def websocket_handler(websocket):
    clients.add(websocket)
    for msg in list(message_buffer):
        try:
            await websocket.send(msg)
        except:
            pass
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)

async def broadcast_loop():
    while True:
        msg = await asyncio.get_event_loop().run_in_executor(None, broadcast_queue.get)
        disconnected = set()
        for client in clients.copy():
            try:
                await client.send(msg)
            except:
                disconnected.add(client)
        clients.difference_update(disconnected)

async def websocket_server():
    async with websockets.serve(websocket_handler, "0.0.0.0", WEBSOCKET_PORT):
        print(f"✅ WebSocket 推播伺服器啟動於 ws://localhost:{WEBSOCKET_PORT}")
        await broadcast_loop()

# ======== Scapy Sniffer ========
def handle_packet(pkt):
    if TCP not in pkt: return
    payload = bytes(pkt[TCP].payload)
    idx = payload.find(b"TOZ ")
    while idx >= 0 and idx + 8 <= len(payload):
        size = int.from_bytes(payload[idx+4:idx+8], "little")
        if idx + 8 + size > len(payload): break
        blob = payload[idx:idx+8+size]
        try:
            parsed = ChatParser.parse_packet_bytes(blob)
            if parsed.get("Nickname") or parsed.get("Text"):
                msg_json = json.dumps(parsed, ensure_ascii=False)
                broadcast_queue.put(msg_json)
                message_buffer.append(msg_json)
        except Exception as e:
            print(f"❌ 解析失敗：{e}")
        idx = payload.find(b"TOZ ", idx + 1)

# ======== 主程式 ========
if __name__ == "__main__":
    print(f">> 🟢 啟動 Sniffer 中（{BPF_FILTER}） ✅ 已啟動 MapleStory 聊天 WebSocket 推播器")
    subprocess.Popen(["python3", "-m", "http.server", "8000"])
    webbrowser.open("http://localhost:8000")
    threading.Thread(target=lambda: AsyncSniffer(filter=BPF_FILTER, prn=handle_packet, store=False).start(), daemon=True).start()
    asyncio.run(websocket_server())
    
