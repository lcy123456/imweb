import { message } from "@/AntdGlobalComp";

interface ErrorData {
  errCode: number;
  errMsg?: string;
}

export const errorHandle = (err: unknown) => {
  const errData = err as ErrorData;
  message.error(
    errCodeMap[errData?.errCode] || errData?.errMsg || "未知的接口错误，请联系管理员",
  );
};

const errCodeMap: Record<number, string> = {
  10001: "密码错误",
  10002: "用户不存在",
  10003: "账号已注册",
  10004: "账号已注册",
  10005: "验证码的发送频率太快了！",
  10006: "验证码错误",
  10007: "验证码已过期",
  10008: "验证码失败次数过多",
  10009: "验证码已被使用",
  10010: "邀请码已被使用",
  10011: "邀请码不存在",
  10012: "账号已禁用",
  10013: "拒绝添加好友",
  10014: "原密码跟新密码一致",
  10015: "邮箱已绑定",
  10016: "邮箱格式错误",
};
