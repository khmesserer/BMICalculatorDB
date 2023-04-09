import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function BMIs() {
  const [bmis, setBMIs] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from bmis order by id desc;`,
        null,
        (_, { rows: { _array } }) => setBMIs(_array)
      );
    });
  }, []);

  if (bmis === null || bmis.length === 0) {
    return null;
  }

  return (
    <View>
      {bmis.map(({ bmi, weight, height, bmiDate }) => (
        <Text style={styles.sectionContent}>{bmiDate}: {bmi} (W:{weight}, H:{height})</Text>
      ))}
    </View>
  );
}

export default function App() {
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBMI] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  const onCompute = async () => {
    if(isNaN(weight) || weight <= 0){
      alert("Weight must be a valid positive number");
    } else if(isNaN(height) || height <= 0){
      alert("Height must be valid positive number");
    }else{
      setBMI(((weight / (height * height)) * 703).toFixed(1));
      
      try {
        add();
      } catch (error) {
        alert('There was an error while saving the data');
      }
    }
  }
  
  const onWeightChange = (text) => {
    setWeight(text);
  }
  
  const onHeightChange = (text) => {
    setHeight(text);
  }

  const getBMIDescription = () => {
    var description = "Underweight";

    if(bmi > 30) {
      description = "Obese";
    } else if(bmi > 25){
      description = "Overweight";
    }else if(bmi > 18.5){
      description = "Healthy";
    }

    return "(" + description + ")";
  }

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists bmis (id integer primary key not null, bmi real, weight real, height real, bmiDate real);"
      );
    });
  }, []);

  const add = () => {
    db.transaction(
      (tx) => {
        tx.executeSql("insert into bmis (bmi, weight, height, bmiDate) values (?, ?, ?, date('now'))", [bmi, weight, height]);
        tx.executeSql(`select id, bmi, weight, height, date(bmiDate) as bmiDate from bmis order by id desc;`, [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BMI Calculator</Text>
      </View>
      <View style={styles.contentContainer}>
        <TextInput
          style={styles.input}
          onChangeText={onWeightChange}
          placeholder="Weight in Pounds"
        />
        <TextInput
          style={styles.input}
          onChangeText={onHeightChange}
          placeholder="Height in Inches"
          value={ height != null ? height : "" }
        />
        <TouchableOpacity onPress={onCompute} style={styles.button}>
          <Text style={styles.buttonText}>Compute BMI</Text>
        </TouchableOpacity>
        <SafeAreaView style={styles.resultContainer}>
          <Text style={styles.result}>{ bmi != null && bmi != '' ? "Body Mass Index is " + bmi : "" }</Text>
          <Text style={styles.result}>{ bmi != null && bmi != '' ? getBMIDescription() : "" }</Text>
        </SafeAreaView>
        <Text style={styles.sectionHeading}>BMI History</Text>
        <ScrollView style={styles.sectionContainer}>
          <BMIs key={forceUpdateId}/>
        </ScrollView>
      </View>
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f4511e',
    width: '100%',
  },
  title: {
    marginTop: 30,
    paddingVertical: 15,
    fontSize: 28,
    color: "#fff",
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentContainer: {
    marginHorizontal: 5,
  },
  input: {
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    width: 400,
    height: 40,
    padding: 5,
    fontSize: 24,
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#34495e',
    color: '#fff',
    padding: 10,
    borderRadius: 3,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
  },
  resultContainer: {
    marginVertical: 30,
  },
  result: {
    fontSize: 28,
    textAlign: 'center',
  },
  sectionContent: {
    fontSize: 20,
    color: '#000',
    marginLeft: 20,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    height: 100,
  },
  sectionHeading: {
    fontSize: 24,
    marginBottom: 8,
    marginLeft: 20,
  },
});