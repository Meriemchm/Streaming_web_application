//import React from "react";
import React, { useState, useEffect } from "react";
import Content from "./Content";

const Form = () => {
  const [serverIp, setServerIp] = useState("");
  const [serverReady, setServerReady] = useState(false);
  const apiUrl = import.meta.env.VITE_SERVER_IP ;

  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen p-4 bg-gray-100">
      <form
        className="flex flex-col w-full max-w-md p-6 bg-white rounded-lg shadow-md"
        action={`http://${apiUrl}:3000/upload`}
        method="POST"
        encType="multipart/form-data"
      >
        <label
          htmlFor="video"
          className="mb-4 text-lg font-semibold text-gray-700"
        >
          Sélectionnez une vidéo :
        </label>
        <input
          className="py-2 px-4 mb-6 border border-gray-300 rounded-lg "
          type="file"
          name="video"
          id="video"
          accept="video/*"
          required
        />
        <button
          type="submit"
          className="py-2 px-4 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Téléverser la vidéo
        </button>
      </form>

      <div className="w-full max-w-4xl mt-10">
        <Content />
      </div>
    </div>
  );
};

export default Form;
