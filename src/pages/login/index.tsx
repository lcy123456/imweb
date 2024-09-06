import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import login_left_bg from "@/assets/images/login/login_left_bg.png";
import logo_name_white from "@/assets/images/logo_name_white.png";
import WindowControlBar from "@/components/WindowControlBar";
import { getIMToken, getIMUserID } from "@/utils/storage";

import styles from "./index.module.scss";
import LoginForm from "./LoginForm";
import LoginQr from "./LoginQr";
import ModifyForm from "./ModifyForm";
import RegisterForm from "./RegisterForm";

export type FormType = 0 | 1 | 2 | 3;

export const Login = () => {
  const navigate = useNavigate();
  const [formType, setFormType] = useState<FormType>(0);

  useEffect(() => {
    const loginCheck = async () => {
      const IMToken = await getIMToken();
      const IMUserID = await getIMUserID();
      if (IMToken && IMUserID) {
        navigate("/home");
        return;
      }
    };
    loginCheck();
  }, []);

  const LeftBar = () => (
    <div className="flex min-h-[420] flex-1 flex-col items-center justify-center">
      <div className="relative flex w-4/5 flex-col items-center justify-center text-center">
        <img
          className="absolute left-0 top-[-60px] xl:top-[-130px]"
          src={logo_name_white}
          alt="logo_name_white"
          width={140}
        />
        <img src={login_left_bg} alt="login_left_bg" />
        <div className="mb-2 mt-5 text-2xl text-white">在线化办公</div>
        <span className="text-xl text-white">多人协作，打造高效办公方式</span>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {window.electronAPI && (
        <div className="app-drag relative h-10 flex-shrink-0 bg-[var(--top-search-bar)]">
          <WindowControlBar />
        </div>
      )}
      <div className={`${styles.login} flex flex-1`}>
        <LeftBar />
        <div className="flex flex-1 items-center justify-center">
          <div
            className="relative h-[500px] w-[350px] rounded-md bg-white p-[48px]"
            style={{ boxShadow: "0 0 30px rgba(0,0,0,.25)" }}
          >
            {formType === 0 && <LoginForm setFormType={setFormType} />}
            {formType === 1 && <ModifyForm setFormType={setFormType} />}
            {formType === 2 && <RegisterForm setFormType={setFormType} />}
            {formType === 3 && <LoginQr setFormType={setFormType} />}
          </div>
        </div>
      </div>
    </div>
  );
};
