import re
import pandas as pd
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

factory = StemmerFactory()
stemmer = factory.create_stemmer()

stop_factory = StopWordRemoverFactory()
stopwords = stop_factory.get_stop_words()

def cleaning(text):
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z\s]", "", text)
    return text

def case_folding(text):
    return text.lower()

def tokenizing(text):
    return text.split()

def remove_stopwords(tokens):
    return [word for word in tokens if word not in stopwords]

def stemming(tokens):
    return [stemmer.stem(word) for word in tokens]

def preprocess(text):
    text = cleaning(text)
    text = case_folding(text)
    tokens = tokenizing(text)
    tokens = remove_stopwords(tokens)
    tokens = stemming(tokens)
    return " ".join(tokens)