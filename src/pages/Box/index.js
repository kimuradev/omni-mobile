import React, { Component } from "react";
import AsyncStorage from "@react-native-community/async-storage";
import api from "../../services/api";

import Icon from "react-native-vector-icons/MaterialIcons";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import ImagePicker from "react-native-image-picker";
import FileViewer from "react-native-file-viewer";
import RNFS from "react-native-fs";

import socket from "socket.io-client";
import { distanceInWords } from "date-fns";
import pt from "date-fns/locale/pt";

import styles from "./styles";

export default class Box extends Component {
  state = {
    box: ""
  };

  async componentDidMount() {
    const box = await AsyncStorage.getItem("@RocketBox:box");
    this.subscribeToNewFiles(box);
    console.log(box);
    const response = await api.get(`boxes/${box}`);

    this.setState({ box: response.data });
  }

  // getLocalPath = url => {
  //   const filename = url.split("/").pop();
  //   return `${RNFS.DocumentDirectoryPath}/${filename}`;
  // };

  openFile = async file => {
    try {
      const filePath = `${RNFS.DocumentDirectoryPath}/${file.title}`;

      console.log("url: ", file.url);
      console.log("localFile: ", filePath);

      await RNFS.downloadFile({
        fromUrl: file.url,
        toFile: filePath
      });

      await FileViewer.open(filePath);
    } catch (err) {
      console.log("Arquivo não suportado", err);
    }
  };

  renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => this.openFile(item)} style={styles.file}>
      <View style={styles.fileInfo}>
        <Icon name="insert-drive-file" size={24} color="#A5CFFF" />
        <Text style={styles.fileTitle}>{item.title}</Text>
      </View>

      <Text style={styles.fileDate}>
        há{" "}
        {distanceInWords(item.createdAt, new Date(), {
          locale: pt
        })}
      </Text>
    </TouchableOpacity>
  );

  handleUpload = () => {
    ImagePicker.launchImageLibrary({}, async upload => {
      if (upload.error) {
        console.log("ImagePicker error");
      } else if (upload.didCancel) {
        console.log("Canceled by user");
      } else {
        console.log(upload);

        // filename só pra ios
        // const [prefix, suffix] = upload.fileName.split(".");
        // const ext = suffix.toLowerCase() === "heic" ? "jpg" : suffix;

        const data = new FormData();
        const box = this.state.box._id;

        data.append("file", {
          uri: upload.uri,
          type: upload.type,
          name: upload.fileName
        });

        console.log("data: ", data);

        api.post(`boxes/${box}/files`, data);
      }
    });
  };

  subscribeToNewFiles = box => {
    const io = socket("https://omnistack-backend-1.herokuapp.com");

    io.emit("connectRoom", box);

    io.on("file", data => {
      console.log(data);

      this.setState({
        box: { ...this.state.box, files: [data, ...this.state.box.files] }
      });
    });
  };

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.boxTitle}>{this.state.box.title}</Text>
        <FlatList
          style={styles.list}
          data={this.state.box.files}
          keyExtractor={file => file._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={this.renderItem}
        />

        <TouchableOpacity style={styles.fab} onPress={this.handleUpload}>
          <Icon name="cloud-upload" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    );
  }
}
