import React from "react";
import Content from "./Content";

const Form = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-full">
      <form
        className="flex flex-col mx-auto"
        action="http://localhost:3000/upload"
        method="POST"
        encType="multipart/form-data"
      >
        <label htmlFor="video">Sélectionnez une vidéo :</label>
        <input
          className="py-12"
          type="file"
          name="video"
          id="video"
          accept="video/*"
          required
        />
        <button type="submit" className="border">
          Téléverser la vidéo
        </button>
      </form>

      <div>
        <Content />
      </div>
    </div>
  );
};

export default Form;
