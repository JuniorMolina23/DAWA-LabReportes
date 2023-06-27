import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Alignment, StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  generos: string[] = [];
  filtroGenero: string = '';
  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.peliculasFiltradas = data;
      this.generos = this.obtenerGeneros(data);
    });
  }

  obtenerGeneros(peliculas: any[]): string[] {
    const generosSet = new Set<string>();
    for (const pelicula of peliculas) {
      generosSet.add(pelicula.genero);
    }
    return Array.from(generosSet);
  }

  aplicarFiltros() {
    this.peliculasFiltradas = this.peliculas.filter(pelicula => {
      let coincideGenero = true;

      if (this.filtroGenero !== '') {
        coincideGenero = pelicula.genero === this.filtroGenero;
      }


      return coincideGenero;
    });
  }

  generarPDF() {
    this.aplicarFiltros();

    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'cabeceraTabla' },
              { text: 'Género', style: 'cabeceraTabla' },
              { text: 'Año de lanzamiento', style: 'cabeceraTabla' }
            ],
            ...this.peliculasFiltradas.map(pelicula => [
              { text: pelicula.titulo, style: 'textoTabla' },
              { text: pelicula.genero, style: 'textoTabla' },
              { text: pelicula.lanzamiento.toString(), style: 'textoTabla' }
            ])
          ]
        }
      }
    ];

    const estilos: StyleDictionary = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center' as Alignment,
        margin: [0, 0, 0, 10]
      },
      cabeceraTabla: {
        fillColor: 'red',
        color: 'white',
        bold: true,
        fontSize: 12,
        alignment: 'center' as Alignment,
        margin: [0, 5, 0, 5]
      },
    };

    const documentDefinition: TDocumentDefinitions = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  generarExcel() {
    const data = this.peliculasFiltradas.map(pelicula => ({
      Título: pelicula.titulo,
      Género: pelicula.genero,
      'Año de lanzamiento': pelicula.lanzamiento
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Informe': worksheet }, SheetNames: ['Informe'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(excelBlob, 'informe.xlsx');
  }
  
}
